namespace DebtDomino.Core.DTOs.Auth;

public record RegisterRequest(string Email, string Password, string? FirstName);

public record LoginRequest(string Email, string Password);

public record RefreshRequest(string RefreshToken);
