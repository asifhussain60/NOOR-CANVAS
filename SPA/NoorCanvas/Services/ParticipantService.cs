using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using NoorCanvas.Models.DTOs;

namespace NoorCanvas.Services;

/// <summary>
/// [REFACTOR:Week2] Service for managing participant operations across canvas components
/// Consolidates participant loading logic to eliminate ~180 duplicate lines from SessionCanvas, TranscriptCanvas, SessionWaiting
/// Handles both UserToken-based (SessionCanvas/TranscriptCanvas) and SessionToken-based (SessionWaiting) participant loading
/// </summary>
public interface IParticipantService
{
    /// <summary>
    /// Load participants using UserToken (8 chars) for SessionCanvas and TranscriptCanvas
    /// Uses TokenService to resolve SessionId → UserToken, then calls API
    /// </summary>
    Task<ParticipantsResult> LoadParticipantsWithUserTokenAsync(int sessionId, SimplifiedTokenService tokenService);
    
    /// <summary>
    /// Load participants using SessionToken (direct access) for SessionWaiting
    /// </summary>
    Task<ParticipantsResult> LoadParticipantsWithSessionTokenAsync(string sessionToken, string baseUrl);
    
    /// <summary>
    /// Load current participant info from API using token and UserGuid
    /// Eliminates hash-based selection approach used previously
    /// </summary>
    Task<CurrentParticipantResult> LoadCurrentParticipantFromApiAsync(string sessionToken, string userGuid, string baseUrl);
}

public class ParticipantService : IParticipantService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ParticipantService> _logger;

    public ParticipantService(IHttpClientFactory httpClientFactory, ILogger<ParticipantService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// [REFACTOR:Week2] Load participants using UserToken for SessionCanvas/TranscriptCanvas
    /// Pattern extracted from SessionCanvas.razor line 1767 and TranscriptCanvas.razor line 1622
    /// </summary>
    /// <param name="sessionId">Session ID to load participants for</param>
    /// <param name="tokenService">SimplifiedTokenService instance for resolving UserToken from SessionId</param>
    public async Task<ParticipantsResult> LoadParticipantsWithUserTokenAsync(int sessionId, SimplifiedTokenService tokenService)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        
        try
        {
            // [DEBUG-WORKITEM:canvas:API] Get UserToken via SimplifiedTokenService
            _logger.LogInformation("[DEBUG-WORKITEM:canvas:API] [{RequestId}] Getting UserToken via SimplifiedTokenService for SessionId: {SessionId}", requestId, sessionId);
            
            var tokens = await tokenService.GetTokensBySessionIdAsync(sessionId);
            
            if (!tokens.HasValue)
            {
                _logger.LogWarning("[DEBUG-WORKITEM:canvas:API] [{RequestId}] No tokens found for SessionId: {SessionId}", requestId, sessionId);
                return new ParticipantsResult
                {
                    Success = false,
                    StatusCode = 404,
                    ErrorMessage = "No tokens found for session"
                };
            }

            var userToken = tokens.Value.userToken;
            _logger.LogInformation("[DEBUG-WORKITEM:canvas:API] [{RequestId}] Retrieved UserToken: {UserToken}", 
                requestId, userToken ?? "NULL");

            if (string.IsNullOrEmpty(userToken))
            {
                _logger.LogError("[DEBUG-WORKITEM:canvas:API] [{RequestId}] UserToken is null or empty", requestId);
                return new ParticipantsResult
                {
                    Success = false,
                    StatusCode = 400,
                    ErrorMessage = "UserToken is null or empty"
                };
            }

            // [DEBUG-WORKITEM:canvas:API] Use UserToken (8 chars) for participants API
            using var httpClient = _httpClientFactory.CreateClient("NoorCanvasApi");
            var apiUrl = $"api/participant/session/{userToken}/participants";
            
            _logger.LogInformation("[DEBUG-WORKITEM:canvas:API] [{RequestId}] Loading participants with UserToken: {ApiUrl}", requestId, apiUrl);
            
            var response = await httpClient.GetAsync(apiUrl);
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("[DEBUG-WORKITEM:canvas:API] [{RequestId}] Participants API failed - Status: {StatusCode}", 
                    requestId, response.StatusCode);
                return new ParticipantsResult
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ErrorMessage = $"API call failed: {response.StatusCode}"
                };
            }

            _logger.LogInformation("[DEBUG-WORKITEM:canvas:API] [{RequestId}] Participants API response: {Content}", 
                requestId, content.Length > 500 ? content[..500] + "..." : content);

            var participantsResponse = JsonSerializer.Deserialize<ParticipantsResponse>(content, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (participantsResponse?.Participants == null)
            {
                return new ParticipantsResult
                {
                    Success = true,
                    Participants = new List<ParticipantData>(),
                    StatusCode = 200
                };
            }

            // [DEBUG-WORKITEM:use-landing:trace] Log participants received from API ;CLEANUP_OK
            _logger.LogInformation("[DEBUG-WORKITEM:use-landing:trace] [{RequestId}] API returned {Count} participants ;CLEANUP_OK",
                requestId, participantsResponse.Participants.Count);
            for (int i = 0; i < participantsResponse.Participants.Count; i++)
            {
                var p = participantsResponse.Participants[i];
                _logger.LogInformation("[DEBUG-WORKITEM:use-landing:trace] [{RequestId}] API Participant {Index}: UserId={UserId}, DisplayName={DisplayName}, Country={Country} ;CLEANUP_OK",
                    requestId, i + 1, p.UserId, p.DisplayName, p.Country);
            }
            
            // Convert API participants to display participants
            var displayParticipants = participantsResponse.Participants.Select(p => new ParticipantData
            {
                UserId = p.UserId,
                Name = p.DisplayName,
                Country = p.Country ?? "Unknown",
                Flag = p.CountryFlag?.ToLower() ?? ""
            }).ToList();
            
            // [DEBUG-WORKITEM:use-landing:trace] Log participants after client-side transformation ;CLEANUP_OK
            _logger.LogInformation("[DEBUG-WORKITEM:use-landing:trace] [{RequestId}] After client transformation: {Count} participants ;CLEANUP_OK",
                requestId, displayParticipants.Count);
            for (int i = 0; i < displayParticipants.Count; i++)
            {
                var p = displayParticipants[i];
                _logger.LogInformation("[DEBUG-WORKITEM:use-landing:trace] [{RequestId}] Display Participant {Index}: UserId={UserId}, Name={Name}, Country={Country}, Flag={Flag} ;CLEANUP_OK",
                    requestId, i + 1, p.UserId, p.Name, p.Country, p.Flag);
            }
            
            _logger.LogInformation("[DEBUG-WORKITEM:canvas:API] [{RequestId}] Loaded {Count} participants for session canvas", 
                requestId, displayParticipants.Count);

            return new ParticipantsResult
            {
                Success = true,
                Participants = displayParticipants,
                StatusCode = 200
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DEBUG-WORKITEM:canvas:API] [{RequestId}] Error loading participants for session canvas", requestId);
            return new ParticipantsResult
            {
                Success = false,
                StatusCode = 500,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// [REFACTOR:Week2] Load participants using SessionToken for SessionWaiting
    /// Pattern extracted from SessionWaiting.razor line 1277
    /// Uses "default" HttpClient and requires explicit baseUrl
    /// </summary>
    public async Task<ParticipantsResult> LoadParticipantsWithSessionTokenAsync(string sessionToken, string baseUrl)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        
        try
        {
            using var httpClient = _httpClientFactory.CreateClient("default");
            var baseUri = new Uri(baseUrl);
            _logger.LogInformation("[DEBUG-WORKITEM:prod-issues:url-fix] LoadParticipantsAsync using base URL: {BaseUri} ;CLEANUP_OK", baseUrl);
            httpClient.BaseAddress = baseUri;
            
            var apiUrl = $"api/participant/session/{sessionToken}/participants";
            
            var response = await httpClient.GetAsync(apiUrl);
            var content = await response.Content.ReadAsStringAsync();
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("[{RequestId}] Failed to load participants: {StatusCode} - {ErrorContent}", 
                    requestId, response.StatusCode, content);
                _logger.LogWarning("[{RequestId}] Participants API call failed - Token: {Token}, URL: {Url}, Status: {Status}", 
                    requestId, sessionToken, apiUrl, response.StatusCode);
                
                return new ParticipantsResult
                {
                    Success = false,
                    Participants = new List<ParticipantData>(),
                    StatusCode = (int)response.StatusCode,
                    ErrorMessage = $"API call failed: {response.StatusCode}"
                };
            }

            var participantsResponse = JsonSerializer.Deserialize<ParticipantsResponse>(content, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (participantsResponse?.Participants == null)
            {
                return new ParticipantsResult
                {
                    Success = true,
                    Participants = new List<ParticipantData>(),
                    StatusCode = 200
                };
            }

            // Convert API participants to display participants (with database-driven flag codes)
            var displayParticipants = participantsResponse.Participants.Select(p => new ParticipantData
            {
                Name = p.DisplayName,
                Country = p.Country ?? "Unknown",
                Flag = p.CountryFlag ?? "un" // Database-driven flag code from API
            }).ToList();

            return new ParticipantsResult
            {
                Success = true,
                Participants = displayParticipants,
                StatusCode = 200
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{RequestId}] Error loading participants", requestId);
            return new ParticipantsResult
            {
                Success = false,
                Participants = new List<ParticipantData>(),
                StatusCode = 500,
                ErrorMessage = ex.Message
            };
        }
    }

    /// <summary>
    /// [REFACTOR:Week2] Load current participant from API using token and UserGuid
    /// API-BASED APPROACH eliminates hash-based selection that caused "same name on multiple browsers" issue
    /// Pattern extracted from SessionCanvas.razor line 1875 and other components
    /// </summary>
    public async Task<CurrentParticipantResult> LoadCurrentParticipantFromApiAsync(string sessionToken, string userGuid, string baseUrl)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        
        try
        {
            using var httpClient = _httpClientFactory.CreateClient("default");
            var baseUri = new Uri(baseUrl);
            _logger.LogInformation("[DEBUG-WORKITEM:prod-issues:url-fix] LoadCurrentParticipantFromApiAsync using base URL: {BaseUri} ;CLEANUP_OK", baseUrl);
            httpClient.BaseAddress = baseUri;

            if (string.IsNullOrEmpty(userGuid))
            {
                _logger.LogWarning("[DEBUG-WORKITEM:canvas:API] [{RequestId}] Cannot load current participant - UserGuid is null or empty", requestId);
                return new CurrentParticipantResult
                {
                    Success = false,
                    StatusCode = 400,
                    ErrorMessage = "UserGuid is null or empty"
                };
            }

            var apiUrl = $"api/participant/session/{sessionToken}/participant/{userGuid}";
            _logger.LogInformation("[DEBUG-WORKITEM:canvas:API] [{RequestId}] Loading current participant: {ApiUrl}", requestId, apiUrl);
            
            var response = await httpClient.GetAsync(apiUrl);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("[DEBUG-WORKITEM:canvas:API] [{RequestId}] Current participant API failed - Status: {StatusCode}", 
                    requestId, response.StatusCode);
                return new CurrentParticipantResult
                {
                    Success = false,
                    StatusCode = (int)response.StatusCode,
                    ErrorMessage = $"API call failed: {response.StatusCode}"
                };
            }

            var content = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("[DEBUG-WORKITEM:canvas:API] [{RequestId}] Current participant API response: {Content}", 
                requestId, content.Length > 200 ? content[..200] + "..." : content);

            var apiParticipant = JsonSerializer.Deserialize<ParticipantApiData>(content, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (apiParticipant == null)
            {
                return new CurrentParticipantResult
                {
                    Success = false,
                    StatusCode = 404,
                    ErrorMessage = "Participant not found"
                };
            }

            var currentParticipant = new ParticipantData
            {
                UserId = apiParticipant.UserId,
                Name = apiParticipant.DisplayName,
                Country = apiParticipant.Country ?? "Unknown",
                Flag = apiParticipant.CountryFlag?.ToLower() ?? ""
            };

            _logger.LogInformation("[DEBUG-WORKITEM:canvas:API] [{RequestId}] Current participant loaded: UserId={UserId}, Name={Name}, Country={Country}", 
                requestId, currentParticipant.UserId, currentParticipant.Name, currentParticipant.Country);

            return new CurrentParticipantResult
            {
                Success = true,
                CurrentParticipant = currentParticipant,
                CurrentUserGuid = userGuid,
                StatusCode = 200
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DEBUG-WORKITEM:canvas:API] [{RequestId}] Error loading current participant", requestId);
            return new CurrentParticipantResult
            {
                Success = false,
                StatusCode = 500,
                ErrorMessage = ex.Message
            };
        }
    }
}
