namespace DebtDomino.Core.Models;

public class AmortisationSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanId { get; set; }
    public DateTime DebtFreeDate { get; set; }
    public decimal TotalInterestPaid { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal InterestSaved { get; set; }
    public string ScheduleJson { get; set; } = string.Empty;
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;

    public PayoffPlan Plan { get; set; } = null!;
}
