using System.Security.Claims;
using DebtDomino.Core.Models;
using DebtDomino.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DebtDomino.API.Endpoints;

public static class PaymentEndpoints
{
    public static void MapPaymentEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/payments").WithTags("Payments").RequireAuthorization();

        group.MapGet("/", GetPayments);
        group.MapPost("/", LogPayment);
        group.MapDelete("/{id:guid}", DeletePayment);
    }

    private static async Task<IResult> GetPayments(Guid debtId, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        var debt = await db.Debts.FirstOrDefaultAsync(d => d.Id == debtId && d.UserId == userId);
        if (debt is null) return Results.NotFound();

        var payments = await db.Payments
            .Where(p => p.DebtId == debtId)
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new { p.Id, p.Amount, p.PaymentDate, p.Principal, p.Interest, p.BalanceAfter, p.Notes })
            .ToListAsync();

        return Results.Ok(payments);
    }

    private static async Task<IResult> LogPayment(
        LogPaymentRequest req, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        var debt = await db.Debts.FirstOrDefaultAsync(d => d.Id == req.DebtId && d.UserId == userId);
        if (debt is null) return Results.NotFound();

        if (req.Amount <= 0)
            return Results.BadRequest(new { message = "Payment amount must be greater than 0" });

        var monthlyRate = debt.AnnualInterestRate / 100m / 12m;
        var interest = Math.Round(debt.CurrentBalance * monthlyRate, 2);
        var principal = Math.Max(0, req.Amount - interest);
        var newBalance = Math.Max(0, debt.CurrentBalance - principal);

        var payment = new Payment
        {
            DebtId = req.DebtId,
            Amount = req.Amount,
            PaymentDate = req.PaymentDate.HasValue
                ? DateTime.SpecifyKind(req.PaymentDate.Value, DateTimeKind.Utc)
                : DateTime.UtcNow,
            Principal = principal,
            Interest = interest,
            BalanceAfter = newBalance,
            Notes = req.Notes
        };

        debt.CurrentBalance = newBalance;
        debt.UpdatedAt = DateTime.UtcNow;

        if (newBalance == 0)
        {
            debt.IsPaidOff = true;
            debt.PaidOffDate = DateTime.UtcNow;
        }

        db.Payments.Add(payment);
        await db.SaveChangesAsync();
        return Results.Created($"/api/payments/{payment.Id}", payment);
    }

    private static async Task<IResult> DeletePayment(Guid id, ClaimsPrincipal user, AppDbContext db)
    {
        var userId = GetUserId(user);
        var payment = await db.Payments
            .Include(p => p.Debt)
            .FirstOrDefaultAsync(p => p.Id == id && p.Debt.UserId == userId);

        if (payment is null) return Results.NotFound();

        // Restore balance
        payment.Debt.CurrentBalance += payment.Principal ?? 0;
        payment.Debt.IsPaidOff = false;
        payment.Debt.PaidOffDate = null;

        db.Payments.Remove(payment);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    private static Guid GetUserId(ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

public record LogPaymentRequest(Guid DebtId, decimal Amount, DateTime? PaymentDate, string? Notes);
