using DebtDomino.Core.Services;
using Xunit;

namespace DebtDomino.Tests;

public class AmortisationServiceTests
{
    private readonly AmortisationService _svc = new();

    private static DebtInput Debt(string name, decimal balance, decimal rate, decimal minPayment, int sort = 0) =>
        new(Guid.NewGuid(), name, balance, rate, minPayment, sort);

    // ── Single debt ──────────────────────────────────────────────────────

    [Fact]
    public void SingleDebt_NoExtra_CalculatesCorrectPayoffAndInterest()
    {
        // £5,000 at 19.99%, £150/month minimum (covers the ~£83/month interest)
        // Expected payoff ~49 months, ~£2,300 interest
        var result = _svc.Calculate([Debt("Card", 5000, 19.99m, 150)], "avalanche", 0);

        Assert.True(result.TotalMonths is >= 44 and <= 54, $"Expected ~49 months, got {result.TotalMonths}");
        Assert.True(result.TotalInterestPaid is >= 2000m and <= 2700m, $"Expected ~£2,300 interest, got {result.TotalInterestPaid}");
        Assert.Equal(1, result.DebtResults.Count);
    }

    [Fact]
    public void SingleDebt_WithExtra_PaysFasterAndSavesInterest()
    {
        // £5,000 at 19.99%, £150/month. With £100 extra = £250/month total → ~25 months
        var noExtra = _svc.Calculate([Debt("Card", 5000, 19.99m, 150)], "avalanche", 0);
        var withExtra = _svc.Calculate([Debt("Card", 5000, 19.99m, 150)], "avalanche", 100);

        Assert.True(withExtra.TotalMonths < noExtra.TotalMonths, "Extra payment should reduce months");
        Assert.True(withExtra.TotalInterestPaid < noExtra.TotalInterestPaid, "Extra payment should reduce interest");
        Assert.True(withExtra.TotalMonths is >= 20 and <= 30, $"Expected ~25 months with £100 extra, got {withExtra.TotalMonths}");
    }

    [Fact]
    public void SingleDebt_ZeroInterest_PaysOffInExpectedMonths()
    {
        // £1,200 at 0%, £100/month = exactly 12 months
        var result = _svc.Calculate([Debt("Interest-free", 1200, 0, 100)], "avalanche", 0);

        Assert.Equal(12, result.TotalMonths);
        Assert.Equal(0, result.TotalInterestPaid);
    }

    [Fact]
    public void SingleDebt_ExtraLargerThanBalance_PaysOffInOneMonth()
    {
        var result = _svc.Calculate([Debt("Card", 500, 19.99m, 25)], "avalanche", 10000);

        Assert.Equal(1, result.TotalMonths);
    }

    // ── Avalanche strategy ───────────────────────────────────────────────

    [Fact]
    public void Avalanche_PaysHighestRateFirst()
    {
        var lowRate = Debt("LowRate", 2000, 5m, 50);
        var highRate = Debt("HighRate", 2000, 20m, 50);

        var result = _svc.Calculate([lowRate, highRate], "avalanche", 100);

        var highRateResult = result.DebtResults.First(r => r.Name == "HighRate");
        var lowRateResult = result.DebtResults.First(r => r.Name == "LowRate");

        Assert.True(highRateResult.PayoffMonth <= lowRateResult.PayoffMonth,
            "Avalanche should pay high-rate debt first");
    }

    [Fact]
    public void Avalanche_SavesMoreInterestThanSnowball()
    {
        var debts = new[]
        {
            Debt("SmallHighRate", 1000, 25m, 30),
            Debt("LargeHighRate", 8000, 18m, 150),
            Debt("SmallLowRate",  500,  5m,  20)
        };

        var avalanche = _svc.Calculate(debts, "avalanche", 150);
        var snowball = _svc.Calculate(debts, "snowball", 150);

        Assert.True(avalanche.TotalInterestPaid <= snowball.TotalInterestPaid,
            "Avalanche should never pay more interest than snowball");
    }

    // ── Snowball strategy ────────────────────────────────────────────────

    [Fact]
    public void Snowball_PaysLowestBalanceFirst()
    {
        var small = Debt("Small", 500, 10m, 20);
        var large = Debt("Large", 5000, 15m, 100);

        var result = _svc.Calculate([small, large], "snowball", 100);

        var smallResult = result.DebtResults.First(r => r.Name == "Small");
        var largeResult = result.DebtResults.First(r => r.Name == "Large");

        Assert.True(smallResult.PayoffMonth <= largeResult.PayoffMonth,
            "Snowball should pay small balance first");
    }

    // ── The Domino cascade ───────────────────────────────────────────────

    [Fact]
    public void Domino_FreedMinimumRedirectsToNextDebt()
    {
        // Debt A: £500 at 25%, £100/month — will pay off quickly
        // Debt B: £3000 at 10%, £60/month
        // After A pays off, Debt B should get £100 extra (A's minimum)
        var debtA = Debt("DebtA", 500, 25m, 100);
        var debtB = Debt("DebtB", 3000, 10m, 60);

        var withDomino = _svc.Calculate([debtA, debtB], "avalanche", 0);
        // Manually compute without domino (B only ever gets £60)
        var withoutDomino = _svc.CalculateMinimumsOnly([debtB]);

        // With domino, B gets extra cash after A is paid off — should finish sooner
        var bWithDomino = withDomino.DebtResults.First(r => r.Name == "DebtB");
        var bAlone = withoutDomino.DebtResults.First(r => r.Name == "DebtB");

        Assert.True(bWithDomino.PayoffMonth < bAlone.PayoffMonth,
            "Domino cascade should accelerate Debt B after Debt A is paid off");
    }

    [Fact]
    public void Domino_ThreeDebtCascadeFiresCorrectly()
    {
        var a = Debt("A", 300, 30m, 50);
        var b = Debt("B", 800, 20m, 40);
        var c = Debt("C", 2000, 10m, 60);

        var result = _svc.Calculate([a, b, c], "avalanche", 0);

        var aResult = result.DebtResults.First(r => r.Name == "A");
        var bResult = result.DebtResults.First(r => r.Name == "B");
        var cResult = result.DebtResults.First(r => r.Name == "C");

        // They should pay off in order A, B, C
        Assert.True(aResult.PayoffMonth <= bResult.PayoffMonth, "A should pay off before B");
        Assert.True(bResult.PayoffMonth <= cResult.PayoffMonth, "B should pay off before C");
        Assert.Equal(result.TotalMonths, cResult.PayoffMonth);
    }

    // ── Interest saved ───────────────────────────────────────────────────

    [Fact]
    public void InterestSaved_IsPositiveWhenExtraPaymentApplied()
    {
        var debts = new[] { Debt("Card", 5000, 19.99m, 75) };
        var withExtra = _svc.Calculate(debts, "avalanche", 150);
        var minimums = _svc.CalculateMinimumsOnly(debts);

        withExtra.InterestSaved = minimums.TotalInterestPaid - withExtra.TotalInterestPaid;

        Assert.True(withExtra.InterestSaved > 0, "Should save interest with extra payment");
    }

    // ── Chart points ─────────────────────────────────────────────────────

    [Fact]
    public void ChartPoints_FirstPointIsOriginalBalance()
    {
        var result = _svc.Calculate([Debt("Card", 5000, 19.99m, 150)], "avalanche", 0);
        var points = result.DebtResults[0].MonthlyPoints;

        Assert.Equal(0, points[0].Month);
        Assert.Equal(5000m, points[0].Balance);
    }

    [Fact]
    public void ChartPoints_LastPointIsZero()
    {
        // Use a debt that definitely pays off: £1,200 at 5%, £120/month
        var result = _svc.Calculate([Debt("Card", 1200, 5m, 120)], "avalanche", 0);
        var points = result.DebtResults[0].MonthlyPoints;

        Assert.Equal(0m, points.Last().Balance);
    }

    // ── Edge cases ───────────────────────────────────────────────────────

    [Fact]
    public void EmptyDebts_ReturnsEmptyResult()
    {
        var result = _svc.Calculate([], "avalanche", 0);

        Assert.Equal(0, result.TotalMonths);
        Assert.Empty(result.DebtResults);
    }

    [Fact]
    public void HighInterestRate_DoesNotCauseInfiniteLoop()
    {
        // 39.9% APR — common for payday/credit products
        var result = _svc.Calculate([Debt("HighAPR", 2000, 39.9m, 80)], "avalanche", 0);

        Assert.True(result.TotalMonths < 600, "Should resolve within safety cap");
        Assert.True(result.TotalMonths > 0);
    }

    [Fact]
    public void DebtFreeDate_IsInTheFuture()
    {
        var result = _svc.Calculate([Debt("Card", 5000, 19.99m, 75)], "avalanche", 0);

        Assert.True(result.DebtFreeDate > DateTime.UtcNow, "Debt-free date should be in the future");
    }
}
