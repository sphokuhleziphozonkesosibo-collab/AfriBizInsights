using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AfriBizInsights.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AfriBizInsights.Services.Email;

public class ResendEmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ResendEmailService> _logger;

    public ResendEmailService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<ResendEmailService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _httpClient.BaseAddress = new Uri("https://api.resend.com/");
    }

    public async Task SendVerificationCodeAsync(string toEmail, string recipientName, string code)
    {
        var subject = $"Your AfriBiz Insights Verification Code: {code}";
        var htmlBody = $@"
            <div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;"">
                <div style=""text-align: center; margin-bottom: 25px;"">
                    <h1 style=""color: #0f172a; margin: 0; font-size: 24px; font-weight: 900;"">AfriBiz <span style=""color: #4f46e5; font-weight: 300;"">Insights</span></h1>
                    <p style=""color: #64748b; font-size: 13px; margin-top: 5px;"">African Business Intelligence & Predictive Analytics</p>
                </div>
                <div style=""padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;"">
                    <p style=""font-size: 15px; color: #1e293b; margin-top: 0;"">Hello <strong>{recipientName}</strong>,</p>
                    <p style=""font-size: 14px; color: #475569; line-height: 1.5;"">Thank you for registering your store. Please use the 6-digit verification code below to activate your account and access your business telemetry dashboard:</p>
                    <div style=""margin: 25px 0; text-align: center;"">
                        <span style=""display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #4f46e5; background-color: #eef2ff; border: 2px dashed #6366f1; border-radius: 12px; padding: 12px 28px; font-family: monospace;"">{code}</span>
                    </div>
                    <p style=""font-size: 12px; color: #94a3b8; text-align: center;"">⚠️ This code is valid for <strong>15 minutes</strong>. Do not share it with anyone.</p>
                </div>
                <p style=""font-size: 11px; color: #94a3b8; text-align: center; margin-top: 25px; margin-bottom: 0;"">If you did not request this code, you can safely ignore this email.</p>
            </div>";

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    public async Task SendPasswordResetCodeAsync(string toEmail, string recipientName, string code)
    {
        var subject = $"AfriBiz Insights Password Reset Code: {code}";
        var htmlBody = $@"
            <div style=""font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;"">
                <div style=""text-align: center; margin-bottom: 25px;"">
                    <h1 style=""color: #0f172a; margin: 0; font-size: 24px; font-weight: 900;"">AfriBiz <span style=""color: #4f46e5; font-weight: 300;"">Insights</span></h1>
                    <p style=""color: #64748b; font-size: 13px; margin-top: 5px;"">Account Security & Password Recovery</p>
                </div>
                <div style=""padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;"">
                    <p style=""font-size: 15px; color: #1e293b; margin-top: 0;"">Hello <strong>{recipientName}</strong>,</p>
                    <p style=""font-size: 14px; color: #475569; line-height: 1.5;"">We received a request to reset the password for your business account. Enter the 6-digit recovery code below to choose a new password:</p>
                    <div style=""margin: 25px 0; text-align: center;"">
                        <span style=""display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #e11d48; background-color: #fff1f2; border: 2px dashed #f43f5e; border-radius: 12px; padding: 12px 28px; font-family: monospace;"">{code}</span>
                    </div>
                    <p style=""font-size: 12px; color: #94a3b8; text-align: center;"">⚠️ This code expires in <strong>15 minutes</strong>. If you did not request a password reset, please secure your account immediately.</p>
                </div>
                <p style=""font-size: 11px; color: #94a3b8; text-align: center; margin-top: 25px; margin-bottom: 0;"">Confidential Security Telemetry • AfriBiz Insights</p>
            </div>";

        await SendEmailAsync(toEmail, subject, htmlBody);
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlContent)
    {
        var apiKey = _configuration["Resend:ApiKey"];
        var fromEmail = _configuration["Resend:FromEmail"] ?? "AfriBiz Insights <onboarding@resend.dev>";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("[Email Mock Dispatch] Resend:ApiKey is not configured. Email to {ToEmail} skipped. Subject: {Subject}", toEmail, subject);
            return;
        }

        try
        {
            var payload = new
            {
                from = fromEmail,
                to = new[] { toEmail },
                subject = subject,
                html = htmlContent
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "emails")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var errorDetails = await response.Content.ReadAsStringAsync();
                _logger.LogError("[Resend Dispatch Error] Code: {StatusCode}, Body: {ErrorDetails}", response.StatusCode, errorDetails);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Resend Exception] Failed sending email to {ToEmail}", toEmail);
        }
    }
}