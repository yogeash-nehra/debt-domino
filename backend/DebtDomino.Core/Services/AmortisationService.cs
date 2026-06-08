namespace DebtDomino.Core.Services;

public interface IAmortisationService
{
    AmortisationResult Calculate(IEnumerable<DebtInput> debts, string strategy, decimal extraMonthlyPayment);
    AmortisationResult CalculateMinimumsOnly(IEnumerable<DebtInput> debts);
}

public class AmortisationService : IAmortisationService
{
    private const int MaxMonths = 600;

    public AmortisationResult Calculate(IEnumerable<DebtInput> debts, string strategy, decimal extraMonthlyPayment)
    {
        var debtList = debts.ToList();
        if (!debtList.Any()) return AmortisationResult.Empty();

        var working = OrderByStrategy(debtList, strategy)
            .Select(d => new WorkingDebt(d))
            .ToList();

        // Extra pool starts with the user-specified extra amount.
        // When a debt is paid off, its minimum payment is added to this pool (the domino).
        var rollingExtra = extraMonthlyPayment;
        var month = 0;

        while (working.Any(d => d.Balance > 0) && month < MaxMonths)
        {
            month++;

            // Determine the current priority debt (first unpaid in strategy order)
            var priority = working.FirstOrDefault(d => d.Balance > 0);

            foreach (var debt in working.Where(d => d.Balance > 0))
            {
                var monthlyRate = debt.AnnualRate / 100m / 12m;
                var interestCharge = Math.Round(debt.Balance * monthlyRate, 2, MidpointRounding.AwayFromZero);

                // Priority debt gets the extra pool on top of its minimum
                var payment = debt == priority
                    ? debt.MinimumPayment + rollingExtra
                    : debt.MinimumPayment;

                // Cap payment at remaining balance + interest
                payment = Math.Min(payment, debt.Balance + interestCharge);

                var principal = Math.Max(0, payment - interestCharge);
                debt.Balance = Math.Max(0, Math.Round(debt.Balance - principal, 2));
                debt.TotalInterest += interestCharge;
                debt.TotalPaid += payment;
                debt.MonthlyPoints.Add(new MonthPoint(month, debt.Balance));

                // THE DOMINO: paid off debt's minimum joins the rolling extra
                if (debt.Balance == 0 && debt.PayoffMonth == 0)
                {
                    debt.PayoffMonth = month;
                    rollingExtra += debt.MinimumPayment;
                }
            }
        }

        return BuildResult(working, month);
    }

    public AmortisationResult CalculateMinimumsOnly(IEnumerable<DebtInput> debts) =>
        Calculate(debts, "avalanche", extraMonthlyPayment: 0);

    private static IOrderedEnumerable<DebtInput> OrderByStrategy(IEnumerable<DebtInput> debts, string strategy) =>
        strategy switch
        {
            "snowball" => debts.OrderBy(d => d.Balance).ThenByDescending(d => d.AnnualRate),
            "custom"   => debts.OrderBy(d => d.SortOrder).ThenByDescending(d => d.AnnualRate),
            _          => debts.OrderByDescending(d => d.AnnualRate).ThenBy(d => d.Balance), // avalanche default
        };

    private static AmortisationResult BuildResult(List<WorkingDebt> working, int totalMonths)
    {
        var results = working.Select(w => new DebtResult(
            w.Id,
            w.Name,
            w.PayoffMonth,
            Math.Round(w.TotalInterest, 2),
            Math.Round(w.TotalPaid, 2),
            w.MonthlyPoints.AsReadOnly()
        )).ToList();

        return new AmortisationResult(
            TotalMonths: totalMonths,
            DebtFreeDate: DateTime.UtcNow.Date.AddMonths(totalMonths),
            TotalInterestPaid: results.Sum(d => d.TotalInterest),
            TotalPaid: results.Sum(d => d.TotalPaid),
            DebtResults: results
        );
    }
}

// ─── Result types ──────────────────────────────────────────────────────────

public sealed class AmortisationResult
{
    public int TotalMonths { get; init; }
    public DateTime DebtFreeDate { get; init; }
    public decimal TotalInterestPaid { get; init; }
    public decimal TotalPaid { get; init; }
    public decimal InterestSaved { get; set; }
    public IReadOnlyList<DebtResult> DebtResults { get; init; } = [];

    public AmortisationResult() { }

    public AmortisationResult(int TotalMonths, DateTime DebtFreeDate, decimal TotalInterestPaid,
        decimal TotalPaid, IReadOnlyList<DebtResult> DebtResults)
    {
        this.TotalMonths = TotalMonths;
        this.DebtFreeDate = DebtFreeDate;
        this.TotalInterestPaid = TotalInterestPaid;
        this.TotalPaid = TotalPaid;
        this.DebtResults = DebtResults;
    }

    public static AmortisationResult Empty() => new()
    {
        TotalMonths = 0,
        DebtFreeDate = DateTime.UtcNow,
        TotalInterestPaid = 0,
        TotalPaid = 0
    };
}

public record DebtResult(
    Guid Id,
    string Name,
    int PayoffMonth,
    decimal TotalInterest,
    decimal TotalPaid,
    IReadOnlyList<MonthPoint> MonthlyPoints
);

public record MonthPoint(int Month, decimal Balance);

public record DebtInput(
    Guid Id,
    string Name,
    decimal Balance,
    decimal AnnualRate,
    decimal MinimumPayment,
    int SortOrder = 0
);

// ─── Internal working state ────────────────────────────────────────────────

internal sealed class WorkingDebt
{
    public Guid Id { get; }
    public string Name { get; }
    public decimal Balance { get; set; }
    public decimal AnnualRate { get; }
    public decimal MinimumPayment { get; }
    public int SortOrder { get; }
    public decimal TotalInterest { get; set; }
    public decimal TotalPaid { get; set; }
    public int PayoffMonth { get; set; }
    public List<MonthPoint> MonthlyPoints { get; } = [];

    public WorkingDebt(DebtInput d)
    {
        Id = d.Id;
        Name = d.Name;
        Balance = d.Balance;
        AnnualRate = d.AnnualRate;
        MinimumPayment = d.MinimumPayment;
        SortOrder = d.SortOrder;
        MonthlyPoints.Add(new MonthPoint(0, d.Balance));
    }
}
