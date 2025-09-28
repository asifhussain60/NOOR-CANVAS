using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoorCanvas.Migrations
{
    /// <inheritdoc />
    public partial class AddSchedulingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ScheduledDate",
                schema: "canvas",
                table: "Sessions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScheduledDuration",
                schema: "canvas",
                table: "Sessions",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ScheduledTime",
                schema: "canvas",
                table: "Sessions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScheduledDate",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "ScheduledDuration",
                schema: "canvas",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "ScheduledTime",
                schema: "canvas",
                table: "Sessions");
        }
    }
}
