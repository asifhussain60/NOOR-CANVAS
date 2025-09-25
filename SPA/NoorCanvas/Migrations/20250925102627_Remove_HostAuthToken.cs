using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoorCanvas.Migrations
{
    /// <inheritdoc />
    public partial class Remove_HostAuthToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the legacy HostAuthToken column from Sessions (if present)
            migrationBuilder.DropColumn(
                name: "HostAuthToken",
                schema: "canvas",
                table: "Sessions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Recreate the legacy column on rollback
            migrationBuilder.AddColumn<string>(
                name: "HostAuthToken",
                schema: "canvas",
                table: "Sessions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }
    }
}
