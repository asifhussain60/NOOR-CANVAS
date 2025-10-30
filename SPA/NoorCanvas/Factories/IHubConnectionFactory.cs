using Microsoft.AspNetCore.SignalR.Client;
using System.Threading.Tasks;

namespace NoorCanvas.Factories
{
    /// <summary>
    /// Factory interface for creating configured SignalR hub connections
    /// [hcp-refactor:phase2] Infrastructure abstraction for testability
    /// </summary>
    public interface IHubConnectionFactory
    {
        /// <summary>
        /// Create a configured hub connection to the specified URL
        /// </summary>
        /// <param name="hubUrl">Hub endpoint URL</param>
        /// <returns>Configured but not started HubConnection instance</returns>
        Task<HubConnection> CreateConnectionAsync(string hubUrl);
    }
}
