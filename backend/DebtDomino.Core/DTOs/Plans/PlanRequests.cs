namespace DebtDomino.Core.DTOs.Plans;

public record SavePlanRequest(string Strategy, decimal ExtraMonthlyPayment);

public record PreviewRequest(
    string Strategy,
    decimal ExtraMonthlyPayment,
    IEnumerable<PreviewDebtInput> Debts
);

public record PreviewDebtInput(
    decimal Balance,
    decimal AnnualRate,
    decimal MinimumPayment,
    int SortOrder = 0
);
