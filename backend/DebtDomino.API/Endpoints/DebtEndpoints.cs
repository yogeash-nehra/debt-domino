using System.Security.Claims;
using DebtDomino.Core.DTOs.Debts;
using DebtDomino.Core.Models;
using DebtDomino.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DebtDomino.API.Endpoints;

public static class DebtEndpoints
{
    public static void MapDebtEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/debts").WithTags("Debts").RequireAuthorization();

        group.MapGet("/", GetAll);
        group.MapPost("/", Create);
        group.MapPut("/{id:guid}", Update);
        group.MapDelete("/{id:guid}", Delete);
        group.MapPatch("/reorder", Reorder);
    }

    private static async Task<IResult> GetAll(ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        var debts = await db.Debts
            .Where(d => d.UserId == userId)
            .OrderBy(d => d.SortOrder).ThenBy(d => d.CreatedAt)
            .Select(d => ToResponse(d))
            .ToListAsync();

        var total = debts.Sum(d => d.CurrentBalance);
        var totalMin = debts.Sum(d => d.MinimumPayment);
        var activeCount = debts.Count(d => !d.IsPaidOff);

        return Results.Ok(new DebtSummaryResponse(debts, total, totalMin, activeCount));
    }

    private static async Task<IResult> Create(CreateDebtRequest req, ClaimsPrincipal user, AppDbContext db)
    {
        if (!DebtTypes.All.Contains(req.DebtType))
            return Results.BadRequest(new { message = "Invalid debt type" });

        if (req.CurrentBalance <= 0)
            return Results.BadRequest(new { message = "Balance must be greater than 0" });

        if (req.AnnualInterestRate < 0 || req.AnnualInterestRate > 100)
            return Results.BadRequest(new { message = "Interest rate must be between 0 and 100" });

        if (req.MinimumPayment <= 0)
            return Results.BadRequest(new { message = "Minimum payment must be greater than 0" });

        var userId = GetUserId(user);
        var maxOrder = await db.Debts.Where(d => d.UserId == userId).MaxAsync(d => (int?)d.SortOrder) ?? 0;

        var debt = new Debt
        {
            UserId = userId,
            Name = req.Name.Trim(),
            DebtType = req.DebtType,
            OriginalBalance = req.CurrentBalance,
            CurrentBalance = req.CurrentBalance,
            AnnualInterestRate = req.AnnualInterestRate,
            MinimumPayment = req.MinimumPayment,
            PaymentDueDay = req.PaymentDueDay,
            SortOrder = maxOrder + 1
        };

        db.Debts.Add(debt);
        await db.SaveChangesAsync();
        return Results.Created($"/api/debts/{debt.Id}", ToResponse(debt));
    }

    private static async Task<IResult> Update(Guid id, UpdateDebtRequest req, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        var debt = await db.Debts.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
        if (debt is null) return Results.NotFound();

        debt.Name = req.Name.Trim();
        debt.DebtType = req.DebtType;
        debt.CurrentBalance = req.CurrentBalance;
        debt.AnnualInterestRate = req.AnnualInterestRate;
        debt.MinimumPayment = req.MinimumPayment;
        debt.PaymentDueDay = req.PaymentDueDay;
        debt.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Results.Ok(ToResponse(debt));
    }

    private static async Task<IResult> Delete(Guid id, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        var debt = await db.Debts.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
        if (debt is null) return Results.NotFound();

        db.Debts.Remove(debt);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static async Task<IResult> Reorder(List<ReorderDebtRequest> items, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        var ids = items.Select(i => i.DebtId).ToList();
        var debts = await db.Debts.Where(d => d.UserId == userId && ids.Contains(d.Id)).ToListAsync();

        foreach (var item in items)
        {
            var debt = debts.FirstOrDefault(d => d.Id == item.DebtId);
            if (debt is not null) debt.SortOrder = item.SortOrder;
        }

        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static Guid GetUserId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)!);

    private static DebtResponse ToResponse(Debt d) => new(
        d.Id, d.Name, d.DebtType, d.OriginalBalance, d.CurrentBalance,
        d.AnnualInterestRate, d.MinimumPayment, d.PaymentDueDay,
        d.IsPaidOff, d.PaidOffDate, d.SortOrder, d.CreatedAt);
}
