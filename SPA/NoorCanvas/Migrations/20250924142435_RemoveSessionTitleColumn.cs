using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NoorCanvas.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSessionTitleColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Title",
                schema: "canvas",
                table: "Sessions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Title",
                schema: "canvas",
                table: "Sessions",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }
    }
}
