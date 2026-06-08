namespace DebtDomino.Core.DTOs.Auth;

public record AuthResponse(string AccessToken, string RefreshToken, UserDto User);

public record UserDto(Guid Id, string Email, string? FirstName);
