using System.Text;
using AfriBizInsights.API.Services;
using AfriBizInsights.Core.Interfaces;
using AfriBizInsights.Infrastructure.Data;
using AfriBizInsights.Services.Analytics;
using AfriBizInsights.Services.Auth;
using AfriBizInsights.Services.Ingestion;
using AfriBizInsights.Services.ML;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure CORS (Allows Vercel Cloud Domain, Localhost, and Mobile clients)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Allows Vercel, localhost, and custom domains
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 2. Database Connection (MySQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 36))
    ));

// 3. Dependency Injection
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantProvider, TenantProvider>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IIngestionService, IngestionService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

builder.Services.AddHttpClient<IMlServiceClient, MlServiceClient>();

// 4. JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "AfriBiz_Super_Secret_Key_For_Development_Only_2026_Secure_Key_Longer_32chars";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "AfriBizInsights",
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "AfriBizInsightsClient",
        ClockSkew = TimeSpan.Zero
    };
});

// 5. Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AfriBiz Insights API", Version = "v1" });
});

var app = builder.Build();

// AUTOMATIC DATABASE MIGRATION ON SERVER STARTUP
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        await dbContext.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Startup Info] Auto-migration: {ex.Message}");
    }
}

// 6. HTTP Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();