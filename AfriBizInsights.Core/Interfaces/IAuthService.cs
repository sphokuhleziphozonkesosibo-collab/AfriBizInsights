using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using AfriBizInsights.Core.DTOs.Auth;

namespace AfriBizInsights.Core.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterBusinessAsync(RegisterBusinessDto dto);
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
}