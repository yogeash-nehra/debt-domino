using System.Security.Claims;
using System.Text.Json;
using DebtDomino.Core.DTOs.Plans;
using DebtDomino.Core.Models;
using DebtDomino.Core.Services;
using DebtDomino.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DebtDomino.API.Endpoints;

public static class PlanEndpoints
{
    public static void MapPlanEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/plans").WithTags("Plans");

        group.MapGet("/active", GetActive).RequireAuthorization();
        group.MapPost("/", SavePlan).RequireAuthorization();
        group.MapPost("/calculate", Calculate).RequireAuthorization();
        group.MapGet("/snapshot", GetSnapshot).RequireAuthorization();
        group.MapPost("/preview", Preview); // no auth — demo mode
    }

    private static async Task<IResult> GetActive(ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        var plan = await db.PayoffPlans
            .Include(p => p.LatestSnapshot)
            .FirstOrDefaultAsync(p => p.UserId == userId && p.IsActive);

        if (plan is null) return Results.NotFound();
        return Results.Ok(ToPlanResponse(plan));
    }

    private static async Task<IResult> SavePlan(SavePlanRequest req, ClaimsPrincipal user, AppDbContext db)
    {
        if (!PayoffStrategies.All.Contains(req.Strategy))
            return Results.BadRequest(new { message = "Invalid strategy" });

        var userId = GetUserId(user);
        var plan = await db.PayoffPlans.FirstOrDefaultAsync(p => p.UserId == userId && p.IsActive);

        if (plan is null)
        {
            plan = new PayoffPlan { UserId = userId };
            db.PayoffPlans.Add(plan);
        }

        plan.Strategy = req.Strategy;
        plan.ExtraMonthlyPayment = req.ExtraMonthlyPayment;
        plan.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Results.Ok(ToPlanResponse(plan));
    }

    private static async Task<IResult> Calculate(ClaimsPrincipal user, AppDbContext db, IAmortisationService svc)
    {
        var userId = GetUserId(user);

        var plan = await db.PayoffPlans
            .Include(p => p.LatestSnapshot)
            .FirstOrDefaultAsync(p => p.UserId == userId && p.IsActive);

        if (plan is null) return Results.NotFound(new { message = "No active plan found" });

        var debts = await db.Debts
            .Where(d => d.UserId == userId && !d.IsPaidOff)
            .ToListAsync();

        if (!debts.Any()) return Results.BadRequest(new { message = "No active debts to calculate" });

        var inputs = debts.Select(d => new DebtInput(d.Id, d.Name, d.CurrentBalance, d.AnnualInterestRate, d.MinimumPayment, d.SortOrder));
        var result = svc.Calculate(inputs, plan.Strategy, plan.ExtraMonthlyPayment);
        var minimumsResult = svc.CalculateMinimumsOnly(inputs);
        result.InterestSaved = minimumsResult.TotalInterestPaid - result.TotalInterestPaid;

        var scheduleJson = JsonSerializer.Serialize(result.DebtResults.Select(r => new
        {
            debtId = r.Id,
            debtName = r.Name,
            payoffMonth = r.PayoffMonth,
            totalInterest = r.TotalInterest,
            chartPoints = r.MonthlyPoints.Select(p => new { p.Month, p.Balance })
        }));

        if (plan.LatestSnapshot is null)
        {
            var snapshot = new AmortisationSnapshot
            {
                PlanId = plan.Id,
                DebtFreeDate = result.DebtFreeDate,
                TotalInterestPaid = result.TotalInterestPaid,
                TotalPaid = result.TotalPaid,
                InterestSaved = result.InterestSaved,
                ScheduleJson = scheduleJson
            };
            db.AmortisationSnapshots.Add(snapshot);
            plan.LatestSnapshot = snapshot;
        }
        else
        {
            plan.LatestSnapshot.DebtFreeDate = result.DebtFreeDate;
            plan.LatestSnapshot.TotalInterestPaid = result.TotalInterestPaid;
            plan.LatestSnapshot.TotalPaid = result.TotalPaid;
            plan.LatestSnapshot.InterestSaved = result.InterestSaved;
            plan.LatestSnapshot.ScheduleJson = scheduleJson;
            plan.LatestSnapshot.CalculatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return Results.Ok(ToSnapshotResponse(result, debts.Sum(d => d.CurrentBalance)));
    }

    private static async Task<IResult> GetSnapshot(ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        var snapshot = await db.PayoffPlans
            .Where(p => p.UserId == userId && p.IsActive)
            .Select(p => p.LatestSnapshot)
            .FirstOrDefaultAsync();

        if (snapshot is null) return Results.NotFound();

        var totalDebt = await db.Debts
            .Where(d => d.UserId == userId && !d.IsPaidOff)
            .SumAsync(d => d.CurrentBalance);

        var debtResults = JsonSerializer.Deserialize<List<JsonElement>>(snapshot.ScheduleJson) ?? [];

        var projections = debtResults.Select(r => new DebtProjection(
            r.GetProperty("debtId").GetGuid(),
            r.GetProperty("debtName").GetString() ?? "",
            DateTime.UtcNow.Date.AddMonths(r.GetProperty("payoffMonth").GetInt32()),
            r.GetProperty("payoffMonth").GetInt32(),
            r.GetProperty("totalInterest").GetDecimal(),
            r.GetProperty("chartPoints").EnumerateArray()
                .Select(p => new ChartPoint(p.GetProperty("month").GetInt32(), p.GetProperty("balance").GetDecimal()))
                .ToList()
        ));

        return Results.Ok(new SnapshotResponse(
            snapshot.DebtFreeDate,
            (int)(snapshot.DebtFreeDate - DateTime.UtcNow.Date).TotalDays / 30,
            snapshot.TotalInterestPaid,
            snapshot.InterestSaved,
            totalDebt,
            projections
        ));
    }

    private static IResult Preview(PreviewRequest req, IAmortisationService svc)
    {
        if (!PayoffStrategies.All.Contains(req.Strategy))
            return Results.BadRequest(new { message = "Invalid strategy" });

        var inputs = req.Debts.Select((d, i) => new DebtInput(Guid.NewGuid(), $"Debt {i + 1}", d.Balance, d.AnnualRate, d.MinimumPayment, d.SortOrder));
        var result = svc.Calculate(inputs, req.Strategy, req.ExtraMonthlyPayment);
        var minimumsResult = svc.CalculateMinimumsOnly(inputs);
        result.InterestSaved = minimumsResult.TotalInterestPaid - result.TotalInterestPaid;

        return Results.Ok(ToSnapshotResponse(result, req.Debts.Sum(d => d.Balance)));
    }

    private static SnapshotResponse ToSnapshotResponse(AmortisationResult result, decimal totalDebt) =>
        new(
            result.DebtFreeDate,
            result.TotalMonths,
            result.TotalInterestPaid,
            result.InterestSaved,
            totalDebt,
            result.DebtResults.Select(r => new DebtProjection(
                r.Id,
                r.Name,
                DateTime.UtcNow.Date.AddMonths(r.PayoffMonth),
                r.PayoffMonth,
                r.TotalInterest,
                r.MonthlyPoints.Select(p => new ChartPoint(p.Month, p.Balance)).ToList()
            ))
        );

    private static PlanResponse ToPlanResponse(PayoffPlan plan) =>
        new(plan.Id, plan.Strategy, plan.ExtraMonthlyPayment, null);

    private static Guid GetUserId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
