using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoorCanvas.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveOriginalComplexSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // WARNING: This migration removes the original 15-table schema
            // Only run this after thorough testing and validation of the simplified schema
            // Ensure you have full database backups before proceeding

            // Step 1: Drop foreign key constraints first
            migrationBuilder.DropForeignKey(
                name: "FK_Annotations_Sessions_SessionId",
                schema: "canvas",
                table: "Annotations");

            migrationBuilder.DropForeignKey(
                name: "FK_HostSessions_Sessions_SessionId", 
                schema: "canvas",
                table: "HostSessions");

            migrationBuilder.DropForeignKey(
                name: "FK_Questions_Sessions_SessionId",
                schema: "canvas", 
                table: "Questions");

            migrationBuilder.DropForeignKey(
                name: "FK_QuestionAnswers_Questions_QuestionId",
                schema: "canvas",
                table: "QuestionAnswers");

            migrationBuilder.DropForeignKey(
                name: "FK_QuestionVotes_Questions_QuestionId",
                schema: "canvas",
                table: "QuestionVotes");

            migrationBuilder.DropForeignKey(
                name: "FK_QuestionVotes_Users_UserId",
                schema: "canvas",
                table: "QuestionVotes");

            migrationBuilder.DropForeignKey(
                name: "FK_Registrations_Sessions_SessionId",
                schema: "canvas",
                table: "Registrations");

            migrationBuilder.DropForeignKey(
                name: "FK_Registrations_Users_UserId",
                schema: "canvas",
                table: "Registrations");

            migrationBuilder.DropForeignKey(
                name: "FK_SessionLinks_Sessions_SessionId",
                schema: "canvas", 
                table: "SessionLinks");

            migrationBuilder.DropForeignKey(
                name: "FK_SessionParticipants_Sessions_SessionId",
                schema: "canvas",
                table: "SessionParticipants");

            migrationBuilder.DropForeignKey(
                name: "FK_SharedAssets_Sessions_SessionId",
                schema: "canvas",
                table: "SharedAssets");

            // Step 2: Drop child tables (tables with foreign keys)
            migrationBuilder.DropTable(
                name: "QuestionVotes",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "QuestionAnswers", 
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Questions",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Annotations",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "SharedAssets",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Registrations",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "SessionParticipants",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "SessionLinks",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "HostSessions",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "AdminSessions",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "AuditLogs",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Issues",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "SecureTokens",
                schema: "canvas");

            // Step 3: Drop parent tables
            migrationBuilder.DropTable(
                name: "Users",
                schema: "canvas");

            migrationBuilder.DropTable(
                name: "Sessions",
                schema: "canvas");

            // Step 4: Rename new tables to original names
            migrationBuilder.RenameTable(
                name: "Sessions_New",
                schema: "canvas",
                newName: "Sessions",
                newSchema: "canvas");

            migrationBuilder.RenameTable(
                name: "Participants_New", 
                schema: "canvas",
                newName: "Participants",
                newSchema: "canvas");

            migrationBuilder.RenameTable(
                name: "SessionData_New",
                schema: "canvas", 
                newName: "SessionData",
                newSchema: "canvas");

            // Step 5: Update index names to match new table names
            migrationBuilder.RenameIndex(
                name: "UQ_Sessions_New_HostToken",
                schema: "canvas",
                table: "Sessions",
                newName: "UQ_Sessions_HostToken");

            migrationBuilder.RenameIndex(
                name: "UQ_Sessions_New_UserToken",
                schema: "canvas", 
                table: "Sessions",
                newName: "UQ_Sessions_UserToken");

            migrationBuilder.RenameIndex(
                name: "IX_Sessions_New_Status_Expires",
                schema: "canvas",
                table: "Sessions", 
                newName: "IX_Sessions_Status_Expires");

            migrationBuilder.RenameIndex(
                name: "IX_Participants_New_SessionId",
                schema: "canvas",
                table: "Participants",
                newName: "IX_Participants_SessionId");

            migrationBuilder.RenameIndex(
                name: "IX_Participants_New_SessionUser", 
                schema: "canvas",
                table: "Participants",
                newName: "IX_Participants_SessionUser");

            migrationBuilder.RenameIndex(
                name: "IX_SessionData_New_SessionId",
                schema: "canvas",
                table: "SessionData",
                newName: "IX_SessionData_SessionId");

            migrationBuilder.RenameIndex(
                name: "IX_SessionData_New_Session_Type",
                schema: "canvas", 
                table: "SessionData",
                newName: "IX_SessionData_Session_Type");

            migrationBuilder.RenameIndex(
                name: "IX_SessionData_New_Query_Optimized",
                schema: "canvas",
                table: "SessionData", 
                newName: "IX_SessionData_Query_Optimized");

            // Step 6: Update foreign key constraint names
            migrationBuilder.DropForeignKey(
                name: "FK_Participants_New_Sessions_New_SessionId",
                schema: "canvas",
                table: "Participants");

            migrationBuilder.DropForeignKey(
                name: "FK_SessionData_New_Sessions_New_SessionId", 
                schema: "canvas",
                table: "SessionData");

            migrationBuilder.AddForeignKey(
                name: "FK_Participants_Sessions_SessionId",
                schema: "canvas",
                table: "Participants",
                column: "SessionId",
                principalSchema: "canvas",
                principalTable: "Sessions", 
                principalColumn: "SessionId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SessionData_Sessions_SessionId",
                schema: "canvas",
                table: "SessionData",
                column: "SessionId", 
                principalSchema: "canvas",
                principalTable: "Sessions",
                principalColumn: "SessionId",
                onDelete: ReferentialAction.Cascade);

            // Step 7: Add completion comment
            migrationBuilder.Sql(@"
                -- Schema simplification complete!
                -- Original 15-table schema has been replaced with 3-table simplified design:
                -- 1. Sessions (with embedded tokens)
                -- 2. Participants (consolidated user management)  
                -- 3. SessionData (universal content storage)
                -- 
                -- Reduction achieved: 15 tables → 3 tables (80% reduction)
                -- All functionality preserved through JSON content storage in SessionData
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // WARNING: This rollback is complex and may result in data loss
            // It's recommended to restore from database backup instead of using this rollback
            
            throw new NotSupportedException(
                "Rollback of schema simplification is not supported due to complexity. " +
                "Please restore from database backup taken before migration if rollback is needed.");
            
            // If you absolutely must implement rollback, you would need to:
            // 1. Rename simplified tables back to *_New
            // 2. Recreate all 15 original tables with proper schema
            // 3. Reverse-migrate data from SessionData JSON back to individual tables
            // 4. Restore all original foreign key relationships
            // This is extremely complex and error-prone - backup restoration is preferred
        }
    }
}