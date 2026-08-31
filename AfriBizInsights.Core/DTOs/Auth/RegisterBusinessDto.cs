using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using System.ComponentModel.DataAnnotations;

namespace AfriBizInsights.Core.DTOs.Auth;

public class RegisterBusinessDto
{
    [Required, MaxLength(150)]
    public string BusinessName { get; set; } = string.Empty;

    [MaxLength(10)]
    public string Currency { get; set; } = "ZAR"; // Default ZAR

    [MaxLength(100)]
    public string Country { get; set; } = "South Africa";

    [MaxLength(100)]
    public string Industry { get; set; } = "Retail";

    [Required, MaxLength(100)]
    public string OwnerFullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;
}