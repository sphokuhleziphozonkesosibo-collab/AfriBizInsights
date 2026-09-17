namespace AfriBizInsights.Core.Interfaces;

public interface IEmailService
{
    Task SendVerificationCodeAsync(string toEmail, string recipientName, string code);
    Task SendPasswordResetCodeAsync(string toEmail, string recipientName, string code);
}