using Microsoft.AspNetCore.Components;

namespace NoorCanvas.Services
{
    /// <summary>
    /// Loading service for managing global spinner state across the application
    /// </summary>
    public class LoadingService
    {
        private bool _isLoading = false;
        private string _loadingMessage = "Loading...";
        private string _loadingSubMessage = "Preparing your content";

        /// <summary>
        /// Event triggered when loading state changes
        /// </summary>
        public event Action? OnLoadingStateChanged;

        /// <summary>
        /// Protected method to notify state changes
        /// </summary>
        protected virtual void NotifyStateChanged()
        {
            OnLoadingStateChanged?.Invoke();
        }

        /// <summary>
        /// Gets the current loading state
        /// </summary>
        public bool IsLoading => _isLoading;

        /// <summary>
        /// Gets the current loading message
        /// </summary>
        public string LoadingMessage => _loadingMessage;

        /// <summary>
        /// Gets the current loading sub-message
        /// </summary>
        public string LoadingSubMessage => _loadingSubMessage;

        /// <summary>
        /// Shows the loading spinner with optional custom messages
        /// </summary>
        /// <param name="message">Main loading message</param>
        /// <param name="subMessage">Secondary loading message</param>
        public void Show(string message = "Loading...", string subMessage = "Preparing your content")
        {
            _isLoading = true;
            _loadingMessage = message;
            _loadingSubMessage = subMessage;
            NotifyStateChanged();
        }

        /// <summary>
        /// Hides the loading spinner
        /// </summary>
        public void Hide()
        {
            _isLoading = false;
            NotifyStateChanged();
        }

        /// <summary>
        /// Shows loading with a minimum display time for better UX
        /// </summary>
        /// <param name="minimumMs">Minimum display time in milliseconds</param>
        /// <param name="message">Loading message</param>
        /// <param name="subMessage">Loading sub-message</param>
        public async Task ShowWithMinimumTime(int minimumMs = 800, string message = "Loading...", string subMessage = "Preparing your content")
        {
            Show(message, subMessage);
            await Task.Delay(minimumMs);
            Hide();
        }

        /// <summary>
        /// Shows loading for an async operation
        /// </summary>
        /// <typeparam name="T">Return type of the operation</typeparam>
        /// <param name="operation">The async operation to execute</param>
        /// <param name="message">Loading message</param>
        /// <param name="subMessage">Loading sub-message</param>
        /// <param name="minimumMs">Minimum loading display time</param>
        /// <returns>Result of the operation</returns>
        public async Task<T> ExecuteWithLoading<T>(
            Func<Task<T>> operation, 
            string message = "Loading...", 
            string subMessage = "Processing your request",
            int minimumMs = 500)
        {
            Show(message, subMessage);
            
            try
            {
                // Execute operation and minimum time concurrently
                var operationTask = operation();
                var delayTask = Task.Delay(minimumMs);
                
                // Wait for both to complete
                var result = await operationTask;
                await delayTask;
                
                return result;
            }
            finally
            {
                Hide();
            }
        }

        /// <summary>
        /// Shows loading for an async operation without return value
        /// </summary>
        /// <param name="operation">The async operation to execute</param>
        /// <param name="message">Loading message</param>
        /// <param name="subMessage">Loading sub-message</param>
        /// <param name="minimumMs">Minimum loading display time</param>
        public async Task ExecuteWithLoading(
            Func<Task> operation,
            string message = "Loading...",
            string subMessage = "Processing your request",
            int minimumMs = 500)
        {
            Show(message, subMessage);

            try
            {
                // Execute operation and minimum time concurrently
                var operationTask = operation();
                var delayTask = Task.Delay(minimumMs);

                // Wait for both to complete
                await operationTask;
                await delayTask;
            }
            finally
            {
                Hide();
            }
        }
    }
}