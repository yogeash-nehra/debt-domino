namespace DebtDomino.Core.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Debt> Debts { get; set; } = new List<Debt>();
    public ICollection<PayoffPlan> Plans { get; set; } = new List<PayoffPlan>();
}
