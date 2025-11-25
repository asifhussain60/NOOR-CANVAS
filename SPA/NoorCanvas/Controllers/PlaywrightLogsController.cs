using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace NoorCanvas.Controllers
{
    [ApiController]
    [Route("api/playwright-logs")]
    public class PlaywrightLogsController : ControllerBase
    {
        private static readonly string LogFilePath = Path.Combine(
            Directory.GetCurrentDirectory(),
            "playwright-interaction-logs.txt");

        [HttpPost]
        public async Task<IActionResult> SaveLogs([FromBody] PlaywrightLogRequest request)
        {
            try
            {
                var logEntries = request.Logs.Select(log => $"[PLAYWRIGHT-LOG] {log}");
                await System.IO.File.AppendAllLinesAsync(LogFilePath, logEntries);
                
                return Ok(new { saved = request.Logs.Count, filePath = LogFilePath });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetLogs()
        {
            try
            {
                if (!System.IO.File.Exists(LogFilePath))
                {
                    return Ok(new { logs = new string[0], message = "No logs yet" });
                }

                var logs = System.IO.File.ReadAllLines(LogFilePath);
                return Ok(new { logs, count = logs.Length, filePath = LogFilePath });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete]
        public IActionResult ClearLogs()
        {
            try
            {
                if (System.IO.File.Exists(LogFilePath))
                {
                    System.IO.File.Delete(LogFilePath);
                }
                return Ok(new { message = "Logs cleared" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class PlaywrightLogRequest
    {
        public List<string> Logs { get; set; } = new();
    }
}
