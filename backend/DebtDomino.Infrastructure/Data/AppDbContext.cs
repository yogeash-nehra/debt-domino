using DebtDomino.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace DebtDomino.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Debt> Debts => Set<Debt>();
    public DbSet<PayoffPlan> PayoffPlans => Set<PayoffPlan>();
    public DbSet<AmortisationSnapshot> AmortisationSnapshots => Set<AmortisationSnapshot>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(255).IsRequired();
            e.Property(u => u.PasswordHash).IsRequired();
        });

        model.Entity<Debt>(e =>
        {
            e.HasKey(d => d.Id);
            e.HasOne(d => d.User).WithMany(u => u.Debts).HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.Cascade);
            e.Property(d => d.Name).HasMaxLength(255).IsRequired();
            e.Property(d => d.DebtType).HasMaxLength(50).IsRequired();
            e.Property(d => d.CurrentBalance).HasColumnType("decimal(12,2)");
            e.Property(d => d.OriginalBalance).HasColumnType("decimal(12,2)");
            e.Property(d => d.AnnualInterestRate).HasColumnType("decimal(7,4)");
            e.Property(d => d.MinimumPayment).HasColumnType("decimal(10,2)");
            e.HasIndex(d => d.UserId);
        });

        model.Entity<PayoffPlan>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasOne(p => p.User).WithMany(u => u.Plans).HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
            e.Property(p => p.Strategy).HasMaxLength(50).IsRequired();
            e.Property(p => p.ExtraMonthlyPayment).HasColumnType("decimal(10,2)");
            e.HasOne(p => p.LatestSnapshot).WithOne(s => s.Plan).HasForeignKey<AmortisationSnapshot>(s => s.PlanId);
        });

        model.Entity<AmortisationSnapshot>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.TotalInterestPaid).HasColumnType("decimal(12,2)");
            e.Property(s => s.TotalPaid).HasColumnType("decimal(14,2)");
            e.Property(s => s.InterestSaved).HasColumnType("decimal(12,2)");
            e.Property(s => s.ScheduleJson).HasColumnType("text");
        });

        model.Entity<Payment>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasOne(p => p.Debt).WithMany(d => d.Payments).HasForeignKey(p => p.DebtId).OnDelete(DeleteBehavior.Cascade);
            e.Property(p => p.Amount).HasColumnType("decimal(10,2)");
            e.Property(p => p.BalanceAfter).HasColumnType("decimal(12,2)");
            e.HasIndex(p => p.DebtId);
        });
    }
}
