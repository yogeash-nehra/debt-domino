using System.Security.Claims;
using DebtDomino.Core.DTOs.Plans;
using DebtDomino.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DebtDomino.API.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this WebApplication app)
    {
        app.MapGet("/api/dashboard", GetDashboard)
            .WithTags("Dashboard")
            .RequireAuthorization();
    }

    private static async Task<IResult> GetDashboard(ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);

        var debts = await db.Debts
            .Where(d => d.UserId == userId)
            .ToListAsync();

        var activeDebts = debts.Where(d => !d.IsPaidOff).ToList();
        var totalOriginal = debts.Sum(d => d.OriginalBalance);
        var totalCurrent = activeDebts.Sum(d => d.CurrentBalance);
        var totalMin = activeDebts.Sum(d => d.MinimumPayment);

        var percentPaidOff = totalOriginal > 0
            ? Math.Round((totalOriginal - totalCurrent) / totalOriginal * 100, 1)
            : 0;

        var snapshot = await db.PayoffPlans
            .Where(p => p.UserId == userId && p.IsActive)
            .Select(p => p.LatestSnapshot)
            .FirstOrDefaultAsync();

        return Results.Ok(new DashboardResponse(
            TotalDebt: totalCurrent,
            TotalMinimumPayment: totalMin,
            ActiveDebts: activeDebts.Count,
            DebtFreeDate: snapshot?.DebtFreeDate,
            InterestSaved: snapshot?.InterestSaved,
            PercentPaidOff: percentPaidOff
        ));
    }

    private static Guid GetUserId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
