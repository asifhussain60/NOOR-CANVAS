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
                    _logger.LogInformation("NOOR-HOST-SERVICE: Using HTTPS URL from configuration: {Url}", httpsUrl);
                    return httpsUrl;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "NOOR-HOST-SERVICE: Could not read Kestrel configuration, using default");
            }

            var fallbackUrl = "https://localhost:7242";
            _logger.LogInformation("NOOR-HOST-SERVICE: Using fallback HTTPS URL: {Url}", fallbackUrl);
            return fallbackUrl;
        }

        /// <summary>
        /// Loads albums from the API
        /// </summary>
        public async Task<List<AlbumData>> LoadAlbumsAsync(string? hostToken = null)
        {
            var albums = new List<AlbumData>();
            
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
                    albums = JsonSerializer.Deserialize<List<AlbumData>>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<AlbumData>();
                    
                    _logger.LogInformation("NOOR-HOST-SERVICE: Loaded {AlbumCount} albums", albums.Count);
                }
                else
                {
                    _logger.LogWarning("NOOR-HOST-SERVICE: Failed to load albums - HTTP {StatusCode}", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-HOST-SERVICE: Error loading albums");
            }
            
            return albums;
        }

        /// <summary>
        /// Loads categories for a specific album
        /// </summary>
        public async Task<List<CategoryData>> LoadCategoriesAsync(string albumId, string? hostToken = null)
        {
            var categories = new List<CategoryData>();
            
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
                    categories = JsonSerializer.Deserialize<List<CategoryData>>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<CategoryData>();
                    
                    _logger.LogInformation("NOOR-HOST-SERVICE: Loaded {CategoryCount} categories for album {AlbumId}", categories.Count, albumId);
                }
                else
                {
                    _logger.LogWarning("NOOR-HOST-SERVICE: Failed to load categories - HTTP {StatusCode}", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-HOST-SERVICE: Error loading categories for album {AlbumId}", albumId);
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
                    
                    _logger.LogInformation("NOOR-HOST-SERVICE: Loaded {SessionCount} sessions for category {CategoryId}", sessions.Count, categoryId);
                }
                else
                {
                    _logger.LogWarning("NOOR-HOST-SERVICE: Failed to load sessions - HTTP {StatusCode}", response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-HOST-SERVICE: Error loading sessions for category {CategoryId}", categoryId);
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
                    HostFriendlyToken = model.HostFriendlyToken,
                    SelectedSession = model.SelectedSession,
                    SelectedCategory = model.SelectedCategory,
                    SelectedAlbum = model.SelectedAlbum,
                    SessionDate = model.SessionDate.ToString("yyyy-MM-dd"),
                    SessionTime = model.SessionTime,
                    SessionDuration = model.SessionDuration
                };

                _logger.LogInformation("NOOR-HOST-SERVICE: Creating session with data: {SessionData}", 
                    JsonSerializer.Serialize(sessionData));

                var response = await httpClient.PostAsJsonAsync("/api/Host/create-session", sessionData);
                
                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<SessionCreationResponse>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    
                    _logger.LogInformation("NOOR-HOST-SERVICE: Session created successfully - ID: {SessionId}", result?.SessionId);
                    return result ?? new SessionCreationResponse { Success = false, Message = "Invalid response format" };
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("NOOR-HOST-SERVICE: Failed to create session - HTTP {StatusCode}: {Error}", 
                        response.StatusCode, errorContent);
                    
                    return new SessionCreationResponse 
                    { 
                        Success = false, 
                        Message = $"Failed to create session: {response.StatusCode}" 
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NOOR-HOST-SERVICE: Error creating session");
                return new SessionCreationResponse 
                { 
                    Success = false, 
                    Message = $"Error creating session: {ex.Message}" 
                };
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
                
                _logger.LogInformation("NOOR-HOST-SERVICE: Validating host token: {Token}", token?.Substring(0, Math.Min(8, token?.Length ?? 0)) + "...");
                
                var response = await httpClient.GetAsync(url);
                
                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    var validationResponse = JsonSerializer.Deserialize<HostSessionValidationResponse>(jsonContent, new JsonSerializerOptions
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
                
                _logger.LogWarning("NOOR-HOST-SERVICE: Token validation failed - Status: {StatusCode}", response.StatusCode);
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