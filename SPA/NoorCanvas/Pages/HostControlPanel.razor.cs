using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.JSInterop;
using NoorCanvas.Services;
using NoorCanvas.Models;
using System.Text.Json;

namespace NoorCanvas.Pages;

/// <summary>
/// Host Control Panel - Code-behind partial class
/// Extracted from main razor file for better organization and maintainability
/// </summary>
public partial class HostControlPanel : ComponentBase, IAsyncDisposable
{
    [Inject] private IHttpClientFactory HttpClientFactory { get; set; } = default!;
    [Inject] private IJSRuntime JSRuntime { get; set; } = default!;
    [Inject] private NavigationManager Navigation { get; set; } = default!;
    [Inject] private ILogger<HostControlPanel> Logger { get; set; } = default!;
    [Inject] private SessionStateService SessionStateService { get; set; } = default!;
    [Inject] private SafeHtmlRenderingService SafeHtmlRenderer { get; set; } = default!;
    [Inject] private AssetProcessingService AssetProcessor { get; set; } = default!;

    [Parameter] public string HostToken { get; set; } = "";

    private HostControlPanelModel? Model { get; set; }
    private HubConnection? hubConnection;
    private HubConnection? qaHubConnection;
    private DotNetObjectReference<HostControlPanel>? dotNetRef;
    private ElementReference transcriptContainer;
    private ErrorDisplay? errorDisplay;
    private bool isLoading = true;
    private long? SessionId => Model?.SessionId;
    private string? UserToken => Model?.UserToken;
    private bool isComponentInitialized = false;

    protected override async Task OnInitializedAsync()
    {
        try
        {
            Logger.LogInformation("HostControlPanel initializing for token: {HostToken}", HostToken);
            
            dotNetRef = DotNetObjectReference.Create(this);
            
            await LoadHostSessionDataAsync();
            await InitializeSignalRConnectionsAsync();
            
            isComponentInitialized = true;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to initialize HostControlPanel for token: {HostToken}", HostToken);
            // Component will show error state
        }
        finally
        {
            isLoading = false;
        }
    }

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender && dotNetRef != null)
        {
            try
            {
                await JSRuntime.InvokeVoidAsync("setDotNetReference", dotNetRef);
                await JSRuntime.InvokeVoidAsync("initializeShareButtons");
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "Failed to initialize JavaScript interop");
            }
        }
    }

    /// <summary>
    /// Load session data from the host sessions API
    /// </summary>
    private async Task LoadHostSessionDataAsync()
    {
        try
        {
            Logger.LogInformation("Loading session data for host token: {HostToken}", HostToken);
            
            using var httpClient = HttpClientFactory.CreateClient("default");
            var response = await httpClient.GetAsync($"/api/host/sessions/token/{HostToken}");

            if (!response.IsSuccessStatusCode)
            {
                Logger.LogWarning("Failed to load session for host token {HostToken}, status: {StatusCode}", 
                    HostToken, response.StatusCode);
                return;
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            Model = JsonSerializer.Deserialize<HostControlPanelModel>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (Model != null)
            {
                Logger.LogInformation("Successfully loaded session {SessionId} for host {HostToken}", 
                    Model.SessionId, HostToken);
                
                // Transform transcript if available
                if (!string.IsNullOrEmpty(Model.TranscriptHtml))
                {
                    Model.TransformedTranscript = await AssetProcessor.TransformTranscriptHtmlAsync(
                        Model.TranscriptHtml, Model.SessionId, Model.SessionStatus);
                }

                // Load questions for the session
                if (!string.IsNullOrEmpty(Model.UserToken))
                {
                    await LoadQuestionsForHostAsync(Model.UserToken);
                }
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Exception loading host session data for token: {HostToken}", HostToken);
        }
    }

    /// <summary>
    /// Load questions for the host session
    /// </summary>
    private async Task LoadQuestionsForHostAsync(string userToken)
    {
        try
        {
            using var httpClient = HttpClientFactory.CreateClient("default");
            var response = await httpClient.GetAsync($"/api/question/session/{userToken}");

            if (response.IsSuccessStatusCode)
            {
                var questionsJson = await response.Content.ReadAsStringAsync();
                var questionsResponse = JsonSerializer.Deserialize<QuestionListResponse>(questionsJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (Model != null && questionsResponse?.Questions != null)
                {
                    Model.Questions = questionsResponse.Questions.ToList();
                    Logger.LogInformation("Loaded {QuestionCount} questions for session", Model.Questions.Count);
                }
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to load questions for user token: {UserToken}", userToken);
        }
    }

    /// <summary>
    /// Initialize SignalR connections for real-time updates
    /// </summary>
    private async Task InitializeSignalRConnectionsAsync()
    {
        try
        {
            // Session Hub Connection
            hubConnection = new HubConnectionBuilder()
                .WithUrl(Navigation.ToAbsoluteUri("/hub/session"))
                .WithAutomaticReconnect()
                .Build();

            // Q&A Hub Connection
            qaHubConnection = new HubConnectionBuilder()
                .WithUrl(Navigation.ToAbsoluteUri("/hub/qa"))
                .WithAutomaticReconnect()
                .Build();

            SetupSignalREventHandlers();

            await hubConnection.StartAsync();
            await qaHubConnection.StartAsync();

            // Join appropriate groups
            if (SessionId.HasValue)
            {
                await hubConnection.InvokeAsync("JoinGroup", $"session_{SessionId}");
                await hubConnection.InvokeAsync("JoinGroup", $"host_{HostToken}");
                await qaHubConnection.InvokeAsync("JoinGroup", $"session_{SessionId}");
            }

            Logger.LogInformation("SignalR connections established for session {SessionId}", SessionId);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to initialize SignalR connections");
        }
    }

    /// <summary>
    /// Set up SignalR event handlers
    /// </summary>
    private void SetupSignalREventHandlers()
    {
        if (hubConnection != null)
        {
            hubConnection.On<string>("SessionStarted", (sessionInfo) =>
            {
                Logger.LogInformation("Received SessionStarted signal: {SessionInfo}", sessionInfo);
                InvokeAsync(async () =>
                {
                    await LoadHostSessionDataAsync();
                    StateHasChanged();
                });
            });

            hubConnection.On<string>("SessionEnded", (sessionInfo) =>
            {
                Logger.LogInformation("Received SessionEnded signal: {SessionInfo}", sessionInfo);
                InvokeAsync(async () =>
                {
                    await LoadHostSessionDataAsync();
                    StateHasChanged();
                });
            });
        }

        if (qaHubConnection != null)
        {
            qaHubConnection.On<string>("QuestionAdded", (questionJson) =>
            {
                Logger.LogInformation("Received QuestionAdded signal");
                InvokeAsync(async () =>
                {
                    if (!string.IsNullOrEmpty(UserToken))
                    {
                        await LoadQuestionsForHostAsync(UserToken);
                        StateHasChanged();
                    }
                });
            });

            qaHubConnection.On<string>("QuestionAnswered", (questionInfo) =>
            {
                Logger.LogInformation("Received QuestionAnswered signal");
                InvokeAsync(async () =>
                {
                    if (!string.IsNullOrEmpty(UserToken))
                    {
                        await LoadQuestionsForHostAsync(UserToken);
                        StateHasChanged();
                    }
                });
            });
        }
    }

    /// <summary>
    /// Start the session
    /// </summary>
    private async Task StartSession()
    {
        if (SessionId == null || isLoading) return;

        try
        {
            isLoading = true;
            StateHasChanged();

            using var httpClient = HttpClientFactory.CreateClient("default");
            var response = await httpClient.PostAsync($"/api/host/session/{SessionId}/start", null);

            if (response.IsSuccessStatusCode)
            {
                Logger.LogInformation("Session {SessionId} started successfully", SessionId);
                await LoadHostSessionDataAsync();
            }
            else
            {
                Logger.LogWarning("Failed to start session {SessionId}, status: {StatusCode}", 
                    SessionId, response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Exception starting session {SessionId}", SessionId);
        }
        finally
        {
            isLoading = false;
            StateHasChanged();
        }
    }

    /// <summary>
    /// End the session
    /// </summary>
    private async Task EndSession()
    {
        if (SessionId == null || isLoading) return;

        try
        {
            isLoading = true;
            StateHasChanged();

            using var httpClient = HttpClientFactory.CreateClient("default");
            var response = await httpClient.PostAsync($"/api/host/session/{SessionId}/end", null);

            if (response.IsSuccessStatusCode)
            {
                Logger.LogInformation("Session {SessionId} ended successfully", SessionId);
                await LoadHostSessionDataAsync();
            }
            else
            {
                Logger.LogWarning("Failed to end session {SessionId}, status: {StatusCode}", 
                    SessionId, response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Exception ending session {SessionId}", SessionId);
        }
        finally
        {
            isLoading = false;
            StateHasChanged();
        }
    }

    /// <summary>
    /// Mark question as answered
    /// </summary>
    private async Task MarkQuestionAnswered(int questionId)
    {
        try
        {
            using var httpClient = HttpClientFactory.CreateClient("default");
            var response = await httpClient.PostAsync($"/api/question/{questionId}/answer", null);

            if (response.IsSuccessStatusCode && !string.IsNullOrEmpty(UserToken))
            {
                Logger.LogInformation("Question {QuestionId} marked as answered", questionId);
                await LoadQuestionsForHostAsync(UserToken);
                StateHasChanged();
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to mark question {QuestionId} as answered", questionId);
        }
    }

    /// <summary>
    /// Delete question (show modal for confirmation)
    /// </summary>
    private async Task ShowDeleteModal(int questionId)
    {
        // This would integrate with a modal component
        // For now, using simple confirmation
        var confirmed = await JSRuntime.InvokeAsync<bool>("confirm", 
            "Are you sure you want to delete this question?");
            
        if (confirmed)
        {
            await DeleteQuestion(questionId);
        }
    }

    /// <summary>
    /// Delete question
    /// </summary>
    private async Task DeleteQuestion(int questionId)
    {
        try
        {
            using var httpClient = HttpClientFactory.CreateClient("default");
            var response = await httpClient.DeleteAsync($"/api/question/{questionId}");

            if (response.IsSuccessStatusCode && !string.IsNullOrEmpty(UserToken))
            {
                Logger.LogInformation("Question {QuestionId} deleted", questionId);
                await LoadQuestionsForHostAsync(UserToken);
                StateHasChanged();
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to delete question {QuestionId}", questionId);
        }
    }

    /// <summary>
    /// Share asset via SignalR (JavaScript callable)
    /// </summary>
    [JSInvokable]
    public async Task<object> ShareAsset(string shareId, string assetType, int instanceNumber)
    {
        try
        {
            Logger.LogInformation("ShareAsset called: {ShareId}, {AssetType}, {Instance}", 
                shareId, assetType, instanceNumber);

            // Find the asset element HTML
            var assetElement = await JSRuntime.InvokeAsync<string>("getAssetElementHtml", shareId);
            
            if (string.IsNullOrEmpty(assetElement))
            {
                Logger.LogWarning("No HTML found for asset {ShareId}", shareId);
                return new { success = false, error = "Asset element not found" };
            }

            // Send via SignalR to participants
            if (hubConnection?.State == HubConnectionState.Connected && SessionId.HasValue)
            {
                await hubConnection.InvokeAsync("ShareAssetToSession", SessionId.Value, new
                {
                    AssetId = shareId,
                    AssetType = assetType,
                    InstanceNumber = instanceNumber,
                    HtmlContent = assetElement,
                    SharedAt = DateTime.UtcNow,
                    SharedBy = "Host"
                });

                Logger.LogInformation("Asset {ShareId} shared successfully to session {SessionId}", 
                    shareId, SessionId);
                
                return new { success = true, assetId = shareId };
            }
            else
            {
                Logger.LogError("Cannot share asset - SignalR not connected or no session");
                return new { success = false, error = "SignalR connection not available" };
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to share asset {ShareId}", shareId);
            return new { success = false, error = ex.Message };
        }
    }

    /// <summary>
    /// Get SignalR connection status color
    /// </summary>
    private string GetSignalRStatusColor()
    {
        var isConnected = hubConnection?.State == HubConnectionState.Connected && 
                         qaHubConnection?.State == HubConnectionState.Connected;
        return isConnected ? "#10B981" : "#EF4444";
    }

    /// <summary>
    /// Get SignalR connection status icon
    /// </summary>
    private string GetSignalRStatusIcon()
    {
        var isConnected = hubConnection?.State == HubConnectionState.Connected && 
                         qaHubConnection?.State == HubConnectionState.Connected;
        return isConnected ? "fa-solid fa-wifi" : "fa-solid fa-wifi-slash";
    }

    /// <summary>
    /// Format session description to proper case
    /// </summary>
    private static string FormatSessionDescriptionToProperCase(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            return description ?? "";
            
        var words = description.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var properCaseWords = new List<string>();
        
        foreach (var word in words)
        {
            if (word.Length == 0) continue;
            
            // Common articles and prepositions that should remain lowercase (except first word)
            var lowercaseWords = new[] { "a", "an", "the", "and", "or", "but", "in", "on", "at", 
                "to", "for", "of", "with", "by", "from", "up", "about", "into", "through", 
                "during", "before", "after", "above", "below", "over", "under", "between", "among" };
            
            if (properCaseWords.Count > 0 && lowercaseWords.Contains(word.ToLower()))
            {
                properCaseWords.Add(word.ToLower());
            }
            else
            {
                properCaseWords.Add(char.ToUpper(word[0]) + word.Substring(1).ToLower());
            }
        }
        
        return string.Join(" ", properCaseWords);
    }
    
    /// <summary>
    /// Format duration from string value to display format
    /// </summary>
    private static string FormatDurationFromString(string? durationString)
    {
        if (string.IsNullOrEmpty(durationString)) return "TBD";
        
        if (int.TryParse(durationString, out int minutes))
        {
            if (minutes >= 60)
            {
                var hours = minutes / 60;
                var remainingMinutes = minutes % 60;
                
                if (remainingMinutes > 0)
                    return $"{hours}h {remainingMinutes}m";
                else
                    return $"{hours} hour{(hours > 1 ? "s" : "")}";
            }
            else
            {
                return $"{minutes} min{(minutes > 1 ? "s" : "")}";
            }
        }
        
        return durationString;
    }

    /// <summary>
    /// Dispose resources
    /// </summary>
    public async ValueTask DisposeAsync()
    {
        try
        {
            if (hubConnection is not null)
            {
                await hubConnection.DisposeAsync();
            }
            
            if (qaHubConnection is not null)
            {
                await qaHubConnection.DisposeAsync();
            }
            
            dotNetRef?.Dispose();
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error disposing HostControlPanel resources");
        }
    }

    /// <summary>
    /// Model for host control panel data
    /// </summary>
    private class HostControlPanelModel
    {
        public long SessionId { get; set; }
        public string? SessionName { get; set; }
        public string? SessionDescription { get; set; }
        public string? SessionStatus { get; set; }
        public string? ScheduledTime { get; set; }
        public string? ScheduledDuration { get; set; }
        public string? UserToken { get; set; }
        public string? TranscriptHtml { get; set; }
        public string? TransformedTranscript { get; set; }
        public string? LogoText { get; set; }
        public List<QuestionDto>? Questions { get; set; }
        public bool UserCopied { get; set; }
    }

    /// <summary>
    /// Question DTO for API communication
    /// </summary>
    private class QuestionDto
    {
        public int Id { get; set; }
        public string Text { get; set; } = "";
        public string? UserName { get; set; }
        public bool IsAnswered { get; set; }
    }

    /// <summary>
    /// Question list response wrapper
    /// </summary>
    private class QuestionListResponse
    {
        public IEnumerable<QuestionDto>? Questions { get; set; }
    }
}