using NoorCanvas.Models;
using NoorCanvas.ViewModels;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Service for managing host session operations
    /// Handles API calls and business logic for session creation and validation
    /// </summary>
    public class HostSessionService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<HostSessionService> _logger;
        private readonly IConfiguration _configuration;

        public HostSessionService(
            IHttpClientFactory httpClientFactory, 
            ILogger<HostSessionService> logger,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Validates time format (HH:MM AM/PM)
        /// </summary>
        public bool ValidateTimeFormat(string time)
        {
            if (string.IsNullOrEmpty(time)) return false;
            var timeRegex = new Regex(@"^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$", RegexOptions.IgnoreCase);
            return timeRegex.IsMatch(time);
        }

        /// <summary>
        /// Formats time input to ensure proper AM/PM spacing
        /// </summary>
        public string FormatTimeInput(string timeInput)
        {
            var value = timeInput.ToUpper().Trim();
            if (value.Length > 2 && (value.EndsWith("AM") || value.EndsWith("PM")) && value[value.Length - 3] != ' ')
            {
                return value.Insert(value.Length - 2, " ");
            }
            return value;
        }

        /// <summary>
        /// Gets the base URL from configuration
        /// </summary>
        public string GetBaseUrl()
        {
            try
            {
                var httpsUrl = _configuration["Kestrel:Endpoints:Https:Url"];
                if (!string.IsNullOrEmpty(httpsUrl))
                {

                    return httpsUrl;
                }
            }
            catch (Exception)
            {
                // Ignore configuration errors and use fallback
            }

            var fallbackUrl = "https://localhost:7242";

            return fallbackUrl;
        }

        /// <summary>
        /// Loads albums from the API
        /// </summary>
        public async Task<List<NoorCanvas.Controllers.AlbumData>> LoadAlbumsAsync(string? hostToken = null)
        {
            var albums = new List<NoorCanvas.Controllers.AlbumData>();

            try
            {
                var httpClient = CreateHttpClient();
                var url = "/api/Host/albums";
                if (!string.IsNullOrEmpty(hostToken))
                {
                    url += $"?guid={Uri.EscapeDataString(hostToken)}";
                }
                var response = await httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    albums = JsonSerializer.Deserialize<List<NoorCanvas.Controllers.AlbumData>>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<NoorCanvas.Controllers.AlbumData>();
                }
                else
                {

                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading albums");
            }
            
            return albums;
        }

        /// <summary>
        /// Loads categories for a specific album
        /// </summary>
        public async Task<List<NoorCanvas.Controllers.CategoryData>> LoadCategoriesAsync(string albumId, string? hostToken = null)
        {
            var categories = new List<NoorCanvas.Controllers.CategoryData>();

            try
            {
                var httpClient = CreateHttpClient();
                var url = $"/api/Host/categories/{albumId}";
                if (!string.IsNullOrEmpty(hostToken))
                {
                    url += $"?guid={Uri.EscapeDataString(hostToken)}";
                }
                var response = await httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    categories = JsonSerializer.Deserialize<List<NoorCanvas.Controllers.CategoryData>>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<NoorCanvas.Controllers.CategoryData>();
                }
                else
                {

                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading categories for album {AlbumId}", albumId);
            }
            
            return categories;
        }

        /// <summary>
        /// Loads sessions for a specific category
        /// </summary>
        public async Task<List<HostSessionData>> LoadSessionsAsync(int categoryId, string? hostToken = null)
        {
            var sessions = new List<HostSessionData>();
            
            try
            {
                var httpClient = CreateHttpClient();
                var url = $"/api/Host/sessions/{categoryId}";
                if (!string.IsNullOrEmpty(hostToken))
                {
                    url += $"?guid={Uri.EscapeDataString(hostToken)}";
                }
                var response = await httpClient.GetAsync(url);
                
                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    sessions = JsonSerializer.Deserialize<List<HostSessionData>>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<HostSessionData>();
                }
                else
                {
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading sessions for category {CategoryId}", categoryId);
            }
            
            return sessions;
        }

        /// <summary>
        /// Creates a session and generates tokens
        /// </summary>
        public async Task<SessionCreationResponse> CreateSessionAndGenerateTokensAsync(HostSessionOpenerViewModel model)
        {
            try
            {
                var httpClient = CreateHttpClient();
                
                var sessionData = new
                {
                    HostGuid = model.HostFriendlyToken,  // Fixed: Changed from HostFriendlyToken to HostGuid to match CreateSessionRequest
                    SessionId = int.TryParse(model.SelectedSession, out var sessionId) ? sessionId : 0,
                    AlbumId = int.TryParse(model.SelectedAlbum, out var albumId) ? albumId : 0,
                    CategoryId = int.TryParse(model.SelectedCategory, out var categoryId) ? categoryId : 0,
                    SessionDate = model.SessionDate.ToString("yyyy-MM-dd"),
                    SessionTime = model.SessionTime,
                    SessionDuration = model.SessionDuration?.ToString() ?? "60"  // Convert int? to string for API compatibility
                };

                _logger.LogInformation("NOOR-HOST-SERVICE: Creating session with data: {SessionData}", 
                    JsonSerializer.Serialize(sessionData));

                var response = await httpClient.PostAsJsonAsync("/api/Host/session/create", sessionData);
                
                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    
                    // Deserialize the actual API response type (CreateSessionResponse)
                    var apiResult = JsonSerializer.Deserialize<NoorCanvas.Controllers.CreateSessionResponse>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    
                    if (apiResult != null)
                    {
                        
                        // Convert to the expected frontend response format
                        return new SessionCreationResponse 
                        { 
                            Success = apiResult.Status == "Success",
                            SessionId = apiResult.SessionId,
                            UserToken = ExtractUserTokenFromJoinLink(apiResult.JoinLink),
                            HostToken = apiResult.SessionGuid,
                            Message = apiResult.Status
                        };
                    }
                    else
                    {

                        return new SessionCreationResponse { Success = false, Message = "Invalid response format" };
                    }
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    
                    return new SessionCreationResponse 
                    { 
                        Success = false, 
                        Message = $"Failed to create session: {response.StatusCode}" 
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating session");
                return new SessionCreationResponse 
                { 
                    Success = false, 
                    Message = $"Error creating session: {ex.Message}" 
                };
            }
        }

        /// <summary>
        /// Extracts user token from join link URL
        /// </summary>
        private string? ExtractUserTokenFromJoinLink(string? joinLink)
        {
            if (string.IsNullOrEmpty(joinLink))
                return null;

            try
            {
                var uri = new Uri(joinLink);
                var segments = uri.AbsolutePath.Split('/');
                return segments.Length > 0 ? segments[segments.Length - 1] : null;
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Validates a host token and returns session information
        /// </summary>
        public async Task<HostTokenValidationResult> ValidateHostTokenAsync(string token)
        {
            try
            {
                var httpClient = CreateHttpClient();
                var url = $"/api/Host/token/{Uri.EscapeDataString(token)}/validate";
                var response = await httpClient.GetAsync(url);
                
                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    var validationResponse = JsonSerializer.Deserialize<NoorCanvas.Controllers.HostSessionValidationResponse>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    
                    if (validationResponse != null)
                    {
                        _logger.LogInformation("NOOR-HOST-SERVICE: Token validation result - Valid: {Valid}, SessionId: {SessionId}", 
                            validationResponse.Valid, validationResponse.SessionId);
                        
                        return new HostTokenValidationResult
                        {
                            Valid = validationResponse.Valid,
                            SessionId = validationResponse.SessionId
                        };
                    }
                }
                
                return new HostTokenValidationResult { Valid = false, SessionId = 0 };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-HOST-SERVICE: Error validating host token: {Token}", token);
                return new HostTokenValidationResult { Valid = false, SessionId = 0 };
            }
        }

        /// <summary>
        /// Gets detailed session information including GroupId and CategoryId
        /// </summary>
        public async Task<SessionDetailsResult?> GetSessionDetailsAsync(int sessionId, string hostToken)
        {
            try
            {
                var httpClient = CreateHttpClient();
                var url = $"/api/Host/session-details/{sessionId}?guid={Uri.EscapeDataString(hostToken)}";
                
                _logger.LogInformation("NOOR-HOST-SERVICE: Getting session details for SessionId: {SessionId}", sessionId);
                
                var response = await httpClient.GetAsync(url);
                
                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    var sessionDetails = JsonSerializer.Deserialize<SessionDetailsResult>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    
                    if (sessionDetails != null)
                    {
                        _logger.LogInformation("NOOR-HOST-SERVICE: Retrieved session details - GroupId: {GroupId}, CategoryId: {CategoryId}, SessionId: {SessionId}", 
                            sessionDetails.GroupId, sessionDetails.CategoryId, sessionDetails.SessionId);
                    }
                    
                    return sessionDetails;
                }
                
                _logger.LogWarning("NOOR-HOST-SERVICE: Failed to get session details - Status: {StatusCode}", response.StatusCode);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-HOST-SERVICE: Error getting session details for SessionId: {SessionId}", sessionId);
                return null;
            }
        }

        /// <summary>
        /// Creates an HTTP client with the base URL configured
        /// </summary>
        private HttpClient CreateHttpClient()
        {
            var httpClient = _httpClientFactory.CreateClient();
            httpClient.BaseAddress = new Uri(GetBaseUrl());
            return httpClient;
        }
    }

    /// <summary>
    /// Result class for host token validation
    /// </summary>
    public class HostTokenValidationResult
    {
        public bool Valid { get; set; }
        public int SessionId { get; set; }
    }

    /// <summary>
    /// Result class for session details
    /// </summary>
    public class SessionDetailsResult
    {
        public int SessionId { get; set; }
        public int GroupId { get; set; }
        public int CategoryId { get; set; }
        public string SessionName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Transcript { get; set; } = string.Empty;
    }
}