namespace DebtDomino.Core.Models;

public class PayoffPlan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = "My Plan";
    public string Strategy { get; set; } = PayoffStrategies.Avalanche;
    public decimal ExtraMonthlyPayment { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public AmortisationSnapshot? LatestSnapshot { get; set; }
}

public static class PayoffStrategies
{
    public const string Avalanche = "avalanche";
    public const string Snowball = "snowball";
    public const string Custom = "custom";

    public static readonly string[] All = [Avalanche, Snowball, Custom];
}
