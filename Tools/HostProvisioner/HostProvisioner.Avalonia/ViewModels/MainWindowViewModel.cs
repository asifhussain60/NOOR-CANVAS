using System;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Services;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Threading;

namespace HostProvisioner.Avalonia.ViewModels;

public partial class MainWindowViewModel : ViewModelBase
{
    private readonly SimplifiedCanvasDbContext _dbContext;
    private readonly KSessionsDbContext _ksessionsContext;
    private readonly SimplifiedTokenService _tokenService;
    private readonly string _baseUrl;
    private Window? _window;

    [ObservableProperty]
    private string _sessionId = "";

    [ObservableProperty]
    private string _hostToken = "";

    [ObservableProperty]
    private string _hostUrl = "";

    [ObservableProperty]
    private string _statusMessage = "";

    [ObservableProperty]
    private string _statusColor = "#006400";

    [ObservableProperty]
    private string _environmentInfo = "";

    [ObservableProperty]
    private string _baseUrlInfo = "";

    [ObservableProperty]
    private string _databaseInfo = "";

    [ObservableProperty]
    private bool _hasHostToken = false;

    [ObservableProperty]
    private bool _hasStatusMessage = false;

    public void SetWindow(Window window)
    {
        _window = window;
    }

    public MainWindowViewModel(
        SimplifiedCanvasDbContext dbContext,
        KSessionsDbContext ksessionsContext,
        SimplifiedTokenService tokenService,
        string baseUrl,
        string environment,
        string database)
    {
        _dbContext = dbContext;
        _ksessionsContext = ksessionsContext;
        _tokenService = tokenService;
        _baseUrl = baseUrl;

        // Set environment info
        EnvironmentInfo = $"🌍 Environment: {environment}";
        BaseUrlInfo = $"🔗 Base URL: {baseUrl}";
        DatabaseInfo = $"🗄️ Database: {database}";
    }

    [RelayCommand]
    private async Task GenerateToken()
    {
        try
        {
            if (string.IsNullOrWhiteSpace(SessionId))
            {
                ShowError("Please enter a Session ID");
                return;
            }

            if (!int.TryParse(SessionId, out int sessionIdInt))
            {
                ShowError("Session ID must be a valid number");
                return;
            }

            ShowStatus("Generating token...", "#C5B358");

            // Verify session exists in KSESSIONS
            var ksession = await _ksessionsContext.Sessions
                .FirstOrDefaultAsync(s => s.SessionId == sessionIdInt);
            
            if (ksession == null)
            {
                ShowError($"Session {sessionIdInt} not found in KSESSIONS");
                return;
            }

            // Verify session has transcripts
            var transcriptCount = await _ksessionsContext.SessionTranscripts
                .CountAsync(st => st.SessionId == sessionIdInt);
                
            if (transcriptCount == 0)
            {
                ShowError($"Session ID {sessionIdInt} has no transcripts available");
                return;
            }

            // Check if canvas.Sessions record exists
            var existingSession = await _dbContext.Sessions.FirstOrDefaultAsync(s => s.SessionId == sessionIdInt);
            NoorCanvas.Models.Simplified.Session canvasSession;
            
            if (existingSession == null)
            {
                // Create simplified canvas.Sessions record
                canvasSession = new NoorCanvas.Models.Simplified.Session
                {
                    SessionId = sessionIdInt,
                    AlbumId = Guid.NewGuid(),
                    Status = "Created",
                    CreatedAt = DateTime.UtcNow,
                    HostToken = "",
                    UserToken = "",
                    ExpiresAt = DateTime.UtcNow.AddHours(24),
                    CreatedBy = "Avalonia Host Provisioner"
                };
                
                _dbContext.Sessions.Add(canvasSession);
                await _dbContext.SaveChangesAsync();
            }
            else
            {
                // [DEBUG-WORKITEM:host-provisioner] Regenerate tokens and reset status for existing session ;CLEANUP_OK
                canvasSession = existingSession;
                canvasSession.Status = "Created";
                canvasSession.HostToken = "";  // Will be regenerated
                canvasSession.UserToken = "";  // Will be regenerated
                canvasSession.CreatedAt = DateTime.UtcNow;
                canvasSession.ExpiresAt = DateTime.UtcNow.AddHours(24);
                canvasSession.CreatedBy = "Avalonia Host Provisioner";
            }

            // Generate friendly tokens using SimplifiedTokenService
            var (generatedHostToken, _) = await _tokenService.GenerateTokenPairForSessionAsync(
                canvasSession.SessionId, 
                validHours: 24,
                clientIp: "127.0.0.1");

            // Update display
            HostToken = generatedHostToken;
            HostUrl = $"{_baseUrl}/host/{generatedHostToken}";
            HasHostToken = true;

            ShowStatus("✅ Token generated successfully!", "#006400");
        }
        catch (Exception ex)
        {
            ShowError($"Error: {ex.Message}");
        }
    }

    [RelayCommand]
    private async Task CopyHostToken()
    {
        try
        {
            if (string.IsNullOrWhiteSpace(HostUrl))
                return;

            if (_window == null)
            {
                ShowError("Window reference not available");
                return;
            }

            // Use Avalonia's cross-platform clipboard API
            var clipboard = TopLevel.GetTopLevel(_window)?.Clipboard;
            if (clipboard != null)
            {
                await clipboard.SetTextAsync(HostUrl);
                ShowStatus("✅ Link copied to clipboard!", "#006400");
            }
            else
            {
                ShowError("Clipboard not available");
            }
        }
        catch (Exception ex)
        {
            ShowError($"Failed to copy: {ex.Message}");
        }
    }

    [RelayCommand]
    private void LaunchHostUrl()
    {
        try
        {
            if (string.IsNullOrWhiteSpace(HostUrl))
                return;

            Process.Start(new ProcessStartInfo
            {
                FileName = HostUrl,
                UseShellExecute = true
            });

            ShowStatus("🚀 Browser launched!", "#006400");
        }
        catch (Exception ex)
        {
            ShowError($"Failed to launch browser: {ex.Message}");
        }
    }

    private void ShowStatus(string message, string color)
    {
        StatusMessage = message;
        StatusColor = color;
        HasStatusMessage = true;

        // Clear status after 5 seconds
        Task.Delay(5000).ContinueWith(_ =>
        {
            Dispatcher.UIThread.Post(() =>
            {
                if (StatusMessage == message) // Only clear if it's still the same message
                {
                    HasStatusMessage = false;
                }
            });
        });
    }

    private void ShowError(string message)
    {
        ShowStatus($"❌ {message}", "#B40000");
    }
}
