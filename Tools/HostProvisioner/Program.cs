using System;
using System.Data;
using System.Data.SqlClient;
using System.Security.Cryptography;
using System.Text;

// Simple host provisioner console app
// Usage: run and follow prompts. Requires a connection string in environment variable KSESSIONS_CONN

var connStr = Environment.GetEnvironmentVariable("KSESSIONS_CONN");
if (string.IsNullOrWhiteSpace(connStr))
{
    Console.WriteLine("ERROR: set environment variable KSESSIONS_CONN with a valid connection string to the KSESSIONS database.");
    return 1;
}

Console.WriteLine("NOOR Canvas Host Provisioner");
Console.WriteLine("Enter GroupId,CategoryId,SessionId as comma-separated values (e.g. 2,45,121):");
var input = Console.ReadLine();
if (string.IsNullOrWhiteSpace(input))
{
    Console.WriteLine("No input provided. Exiting.");
    return 1;
}

var parts = input.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
if (parts.Length != 3 || !int.TryParse(parts[0], out var groupId) || !int.TryParse(parts[1], out var categoryId) || !int.TryParse(parts[2], out var sessionId))
{
    Console.WriteLine("Invalid input. Expected format: groupId,categoryId,sessionId (three integers). Exiting.");
    return 1;
}

Console.WriteLine($"Provisioning host token for Group={groupId}, Category={categoryId}, Session={sessionId}");

using var conn = new SqlConnection(connStr);
await conn.OpenAsync();

// Validate that the records exist in KSESSIONS
var cmdText = @"SELECT s.SessionId, s.Title AS SessionTitle, c.CategoryId, c.Name AS CategoryName, g.GroupId, g.Name AS GroupName
FROM KSESSIONS.dbo.Sessions s
JOIN KSESSIONS.dbo.Categories c ON c.CategoryId = s.CategoryId
JOIN KSESSIONS.dbo.Groups g ON g.GroupId = c.GroupId
WHERE g.GroupId = @groupId AND c.CategoryId = @categoryId AND s.SessionId = @sessionId";
using var cmd = new SqlCommand(cmdText, conn);
cmd.Parameters.AddWithValue("@groupId", groupId);
cmd.Parameters.AddWithValue("@categoryId", categoryId);
cmd.Parameters.AddWithValue("@sessionId", sessionId);

using var reader = await cmd.ExecuteReaderAsync();
if (!reader.HasRows)
{
    Console.WriteLine("No matching session found in KSESSIONS for the provided IDs. Exiting.");
    return 1;
}

await reader.ReadAsync();
var sessionTitle = reader["SessionTitle"]?.ToString() ?? "";
var categoryName = reader["CategoryName"]?.ToString() ?? "";
var groupName = reader["GroupName"]?.ToString() ?? "";

Console.WriteLine($"Found: Group='{groupName}', Category='{categoryName}', Session='{sessionTitle}'");

// Generate a host GUID token (plaintext) and hash it for storage
var hostGuid = Guid.NewGuid().ToString();
var hostTokenHash = ComputeHmacSha256(hostGuid, connStr); // HMAC with connStr as key (simple, replace with app secret in production)

// Insert into canvas.HostSessions table
var insertSql = @"INSERT INTO canvas.HostSessions (SessionId, HostTokenHash, CreatedAt, IsActive)
VALUES (@sessionId, @hash, SYSUTCDATETIME(), 1);
SELECT SCOPE_IDENTITY();";
using var insertCmd = new SqlCommand(insertSql, conn);
insertCmd.Parameters.AddWithValue("@sessionId", sessionId);
insertCmd.Parameters.AddWithValue("@hash", hostTokenHash);

var result = await insertCmd.ExecuteScalarAsync();
var hostSessionId = Convert.ToInt64(result);

Console.WriteLine("Host session created in canvas.HostSessions with ID: " + hostSessionId);
Console.WriteLine("IMPORTANT: Copy the following Host GUID and share it with the host to paste into the NOOR Canvas login page (host should keep it secret):");
Console.WriteLine(hostGuid);

Console.WriteLine("Done.");
return 0;

static byte[] ComputeHmacSha256Bytes(string data, string key)
{
    var keyBytes = Encoding.UTF8.GetBytes(key);
    using var hmac = new HMACSHA256(keyBytes);
    return hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
}
static string ComputeHmacSha256(string data, string key)
{
    return Convert.ToBase64String(ComputeHmacSha256Bytes(data, key));
}
