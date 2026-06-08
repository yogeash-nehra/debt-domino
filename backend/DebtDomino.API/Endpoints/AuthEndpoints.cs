using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DebtDomino.Core.DTOs.Auth;
using DebtDomino.Core.Models;
using DebtDomino.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace DebtDomino.API.Endpoints;

public static class AuthEndpoints
{
    private static readonly Dictionary<string, (string UserId, DateTime Expiry)> RefreshTokens = new();

    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/register", Register);
        group.MapPost("/login", Login);
        group.MapPost("/refresh", Refresh);
        group.MapPost("/logout", Logout).RequireAuthorization();
    }

    private static async Task<IResult> Register(RegisterRequest req, AppDbContext db, IConfiguration config)
    {
        if (await db.Users.AnyAsync(u => u.Email == req.Email.ToLower()))
            return Results.Conflict(new { message = "Email already registered" });

        var user = new User
        {
            Email = req.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, 12),
            FirstName = req.FirstName
        };

        db.Users.Add(user);

        // Create default active plan
        db.PayoffPlans.Add(new PayoffPlan { UserId = user.Id });

        await db.SaveChangesAsync();

        var tokens = GenerateTokens(user, config);
        return Results.Created($"/api/users/{user.Id}", tokens);
    }

    private static async Task<IResult> Login(LoginRequest req, AppDbContext db, IConfiguration config)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower());
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Results.Unauthorized();

        return Results.Ok(GenerateTokens(user, config));
    }

    private static IResult Refresh(RefreshRequest req, IConfiguration config, AppDbContext db)
    {
        if (!RefreshTokens.TryGetValue(req.RefreshToken, out var entry) || entry.Expiry < DateTime.UtcNow)
        {
            RefreshTokens.Remove(req.RefreshToken);
            return Results.Unauthorized();
        }

        var user = db.Users.Find(Guid.Parse(entry.UserId));
        if (user is null) return Results.Unauthorized();

        RefreshTokens.Remove(req.RefreshToken);
        return Results.Ok(GenerateTokens(user, config));
    }

    private static IResult Logout(HttpContext ctx)
    {
        var token = ctx.Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        return Results.NoContent();
    }

    private static AuthResponse GenerateTokens(User user, IConfiguration config)
    {
        var secret = config["Jwt:Secret"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = int.TryParse(config["Jwt:ExpiryMinutes"], out var mins) ? mins : 60;

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: creds
        );

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);

        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        RefreshTokens[refreshToken] = (user.Id.ToString(), DateTime.UtcNow.AddDays(7));

        return new AuthResponse(accessToken, refreshToken, new UserDto(user.Id, user.Email, user.FirstName));
    }
}
