namespace DebtDomino.Core.Models;

public class Debt
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DebtType { get; set; } = string.Empty;
    public decimal OriginalBalance { get; set; }
    public decimal CurrentBalance { get; set; }
    public decimal AnnualInterestRate { get; set; }
    public decimal MinimumPayment { get; set; }
    public int? PaymentDueDay { get; set; }
    public bool IsPaidOff { get; set; } = false;
    public DateTime? PaidOffDate { get; set; }
    public int SortOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

public static class DebtTypes
{
    public const string CreditCard = "credit_card";
    public const string StudentLoan = "student_loan";
    public const string PersonalLoan = "personal_loan";
    public const string CarFinance = "car_finance";
    public const string Mortgage = "mortgage";
    public const string Other = "other";

    public static readonly string[] All = [CreditCard, StudentLoan, PersonalLoan, CarFinance, Mortgage, Other];
}
