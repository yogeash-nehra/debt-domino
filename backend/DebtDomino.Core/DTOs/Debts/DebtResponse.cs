namespace DebtDomino.Core.DTOs.Debts;

public record DebtResponse(
    Guid Id,
    string Name,
    string DebtType,
    decimal OriginalBalance,
    decimal CurrentBalance,
    decimal AnnualInterestRate,
    decimal MinimumPayment,
    int? PaymentDueDay,
    bool IsPaidOff,
    DateTime? PaidOffDate,
    int SortOrder,
    DateTime CreatedAt
);

public record DebtSummaryResponse(
    IEnumerable<DebtResponse> Debts,
    decimal TotalBalance,
    decimal TotalMinimumPayment,
    int ActiveDebtCount
);
