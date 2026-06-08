FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY backend/DebtDomino.sln ./
COPY backend/DebtDomino.API/DebtDomino.API.csproj ./DebtDomino.API/
COPY backend/DebtDomino.Core/DebtDomino.Core.csproj ./DebtDomino.Core/
COPY backend/DebtDomino.Infrastructure/DebtDomino.Infrastructure.csproj ./DebtDomino.Infrastructure/
COPY backend/DebtDomino.Tests/DebtDomino.Tests.csproj ./DebtDomino.Tests/
RUN dotnet restore

COPY backend/ ./
RUN dotnet publish DebtDomino.API/DebtDomino.API.csproj -c Release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /out .
EXPOSE 8080
ENTRYPOINT ["dotnet", "DebtDomino.API.dll"]
