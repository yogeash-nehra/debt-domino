namespace DebtDomino.Core.DTOs.Plans;

public record PlanResponse(
    Guid Id,
    string Strategy,
    decimal ExtraMonthlyPayment,
    SnapshotResponse? Snapshot
);

public record SnapshotResponse(
    DateTime DebtFreeDate,
    int MonthsToFreedom,
    decimal TotalInterestRemaining,
    decimal InterestSaved,
    decimal TotalRemainingDebt,
    IEnumerable<DebtProjection> Debts
);

public record DebtProjection(
    Guid DebtId,
    string Name,
    DateTime PayoffDate,
    int MonthsToPayoff,
    decimal TotalInterest,
    IEnumerable<ChartPoint> ChartPoints
);

public record ChartPoint(int Month, decimal Balance);

public record DashboardResponse(
    decimal TotalDebt,
    decimal TotalMinimumPayment,
    int ActiveDebts,
    DateTime? DebtFreeDate,
    decimal? InterestSaved,
    decimal PercentPaidOff
);
