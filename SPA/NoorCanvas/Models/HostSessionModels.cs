namespace NoorCanvas.Models
{
    /// <summary>
    /// API response and data transfer objects for Host Session Opener
    /// </summary>
    
    public class AlbumData
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Image { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? SpeakerID { get; set; }
        public string? SpeakerName { get; set; }
        public bool IsActive { get; set; }
        public bool IsCompleted { get; set; }
    }

    public class CategoryData
    {
        public int CategoryID { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int GroupID { get; set; }
        public int SortOrder { get; set; }
        public DateTime? CreatedDate { get; set; }
    }

    public class HostSessionData
    {
        public int SessionID { get; set; }
        public string SessionName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime? SessionDate { get; set; }
        public int CategoryID { get; set; }
        public bool IsActive { get; set; }
    }

    public class SessionDetailsResponse
    {
        public int SessionId { get; set; }
        public int GroupId { get; set; }
        public int CategoryId { get; set; }
        public string SessionName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class HostSessionValidationResponse
    {
        public bool Valid { get; set; }
        public int SessionId { get; set; }
        public string? HostGuid { get; set; }
        public HostSessionInfo? Session { get; set; }
        public string? RequestId { get; set; }
    }

    public class CreateSessionResponse
    {
        public long SessionId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string JoinLink { get; set; } = string.Empty;
        public string SessionGuid { get; set; } = string.Empty;
    }

    public class HostSessionInfo
    {
        public int SessionId { get; set; }
        public long? KSessionsId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public int ParticipantCount { get; set; }
        public int? MaxParticipants { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class SessionCreationResponse
    {
        public bool Success { get; set; }
        public string? UserToken { get; set; }
        public string? HostToken { get; set; }
        public long SessionId { get; set; }
        public string? Message { get; set; }
    }
}