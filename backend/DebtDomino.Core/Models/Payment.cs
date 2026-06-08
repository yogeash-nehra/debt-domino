namespace DebtDomino.Core.Models;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DebtId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal? Principal { get; set; }
    public decimal? Interest { get; set; }
    public decimal BalanceAfter { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Debt Debt { get; set; } = null!;
}
