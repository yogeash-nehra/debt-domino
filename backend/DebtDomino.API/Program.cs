using System.Text;
using DebtDomino.API.Endpoints;
using DebtDomino.Core.Services;
using DebtDomino.Infrastructure.Data;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

// ── Auth ──────────────────────────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret is required");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ── Services ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<IAmortisationService, AmortisationService>();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ── CORS ──────────────────────────────────────────────────────────────────
var frontendUrl = builder.Configuration["Frontend:Url"] ?? "http://localhost:5173";
builder.Services.AddCors(opts =>
    opts.AddPolicy("Frontend", p => p
        .WithOrigins(frontendUrl)
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()));

// ── OpenAPI (native .NET 9) ───────────────────────────────────────────────
builder.Services.AddOpenApi();

var app = builder.Build();

// ── Middleware ────────────────────────────────────────────────────────────
app.MapOpenApi();
app.MapScalarApiReference();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

// ── Auto-migrate on startup ───────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// ── Endpoints ─────────────────────────────────────────────────────────────
app.MapAuthEndpoints();
app.MapDebtEndpoints();
app.MapPlanEndpoints();
app.MapDashboardEndpoints();
app.MapPaymentEndpoints();

app.Run();

public partial class Program { }
