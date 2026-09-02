using Microsoft.EntityFrameworkCore;
using AfriBizInsights.Core.Entities;
using AfriBizInsights.Core.Interfaces;

namespace AfriBizInsights.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    private readonly ITenantProvider? _tenantProvider;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ITenantProvider? tenantProvider = null) : base(options)
    {
        _tenantProvider = tenantProvider;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<BusinessAlert> BusinessAlerts => Set<BusinessAlert>();
    public DbSet<Prediction> Predictions => Set<Prediction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Global Multi-Tenant Query Filters
        modelBuilder.Entity<Product>().HasQueryFilter(p => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || p.TenantId == _tenantProvider.GetCurrentTenantId());
        modelBuilder.Entity<Sale>().HasQueryFilter(s => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || s.TenantId == _tenantProvider.GetCurrentTenantId());
        modelBuilder.Entity<SaleItem>().HasQueryFilter(si => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || si.TenantId == _tenantProvider.GetCurrentTenantId());
        modelBuilder.Entity<Expense>().HasQueryFilter(ex => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || ex.TenantId == _tenantProvider.GetCurrentTenantId());
        modelBuilder.Entity<Supplier>().HasQueryFilter(sup => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || sup.TenantId == _tenantProvider.GetCurrentTenantId());
        modelBuilder.Entity<BusinessAlert>().HasQueryFilter(a => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || a.TenantId == _tenantProvider.GetCurrentTenantId());
        modelBuilder.Entity<Prediction>().HasQueryFilter(pr => _tenantProvider == null || _tenantProvider.GetCurrentTenantId() == null || pr.TenantId == _tenantProvider.GetCurrentTenantId());

        // Performance & Uniqueness Indexes
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Sale>()
            .HasIndex(s => new { s.TenantId, s.SaleDate });

        modelBuilder.Entity<Expense>()
            .HasIndex(e => new { e.TenantId, e.ExpenseDate });

        modelBuilder.Entity<Supplier>()
            .HasIndex(sup => new { sup.TenantId, sup.Name });

        modelBuilder.Entity<Product>()
            .HasIndex(p => new { p.TenantId, p.SKU });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var currentTenantId = _tenantProvider?.GetCurrentTenantId();

        if (currentTenantId.HasValue && currentTenantId.Value != Guid.Empty)
        {
            foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
            {
                if (entry.State == EntityState.Added && entry.Entity.TenantId == Guid.Empty)
                {
                    entry.Entity.TenantId = currentTenantId.Value;
                }
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}