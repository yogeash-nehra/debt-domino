namespace DebtDomino.Core.DTOs.Debts;

public record CreateDebtRequest(
    string Name,
    string DebtType,
    decimal CurrentBalance,
    decimal AnnualInterestRate,
    decimal MinimumPayment,
    int? PaymentDueDay
);

public record UpdateDebtRequest(
    string Name,
    string DebtType,
    decimal CurrentBalance,
    decimal AnnualInterestRate,
    decimal MinimumPayment,
    int? PaymentDueDay
);

public record ReorderDebtRequest(Guid DebtId, int SortOrder);
