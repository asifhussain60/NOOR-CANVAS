using System;
using System.Drawing;
using System.Windows.Forms;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models.Simplified;
using NoorCanvas.Services;
using HostProvisioner.Shared;

namespace HostProvisioner.WinForms
{
    public partial class MainForm : Form
    {
        // [DEBUG-WORKITEM:host-provisioner-form:colors] Color scheme from HostLanding.razor
        private static readonly Color NoorGreen = ColorTranslator.FromHtml("#006400");
        private static readonly Color NoorGold = ColorTranslator.FromHtml("#C5B358");
        private static readonly Color NoorBeige = ColorTranslator.FromHtml("#F8F5F1");
        private static readonly Color NoorWhite = ColorTranslator.FromHtml("#FFFFFF");
        private static readonly Color NoorBrown = ColorTranslator.FromHtml("#4B3C2B");

        private readonly IServiceProvider _serviceProvider;
        private TextBox txtSessionId = null!;
        private Button btnGenerate = null!;
        private TextBox txtHostToken = null!;
        private TextBox txtUserToken = null!;
        private Button btnCopyHost = null!;
        private Button btnCopyUser = null!;
        private Label lblStatus = null!;
        private Label lblEnvironment = null!;
        private Label lblDatabase = null!;

        public MainForm()
        {
            // [DEBUG-WORKITEM:host-provisioner-form:config] Initialize services with centralized config
            var services = new ServiceCollection();
            
            // Detect environment using centralized logic
            var (environment, baseUrl) = HostProvisionerConfig.DetectEnvironment("HostProvisioner.WinForms.dll.config");
            
            // Configure services using centralized logic
            HostProvisionerConfig.ConfigureServices(services, environment);
            
            _serviceProvider = services.BuildServiceProvider();

            InitializeComponent();
            ShowEnvironmentInfo();
        }

        private void InitializeComponent()
        {
            // Form settings - Modern card-based design
            this.Text = "NOOR Canvas Host Provisioner";
            this.Size = new Size(550, 800);
            this.BackColor = NoorBeige;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.Font = new Font("Segoe UI", 9F);
            this.Padding = new Padding(30);

            // Main container panel - Card with shadow effect
            var pnlMain = new Panel
            {
                Location = new Point(30, 30),
                Size = new Size(this.ClientSize.Width - 60, this.ClientSize.Height - 60),
                BackColor = Color.White,
                BorderStyle = BorderStyle.None,
                Padding = new Padding(32)
            };
            pnlMain.Paint += (s, e) => DrawRoundedPanel(e.Graphics, pnlMain, 24, Color.White, NoorGold);

            // Logo
            var picLogo = new PictureBox
            {
                Size = new Size(200, 200),
                Location = new Point((pnlMain.Width - 200) / 2, 30),
                SizeMode = PictureBoxSizeMode.Zoom
            };

            try
            {
                var logoPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Resources", "NC-Logo.png");
                if (File.Exists(logoPath))
                {
                    picLogo.Image = Image.FromFile(logoPath);
                }
            }
            catch (Exception ex)
            {
                // [DEBUG-WORKITEM:host-provisioner-form:logo] Logo loading failed
                Console.WriteLine($"Logo loading failed: {ex.Message}");
            }

            // Title
            var lblTitle = new Label
            {
                Text = "Host Provisioner",
                Font = new Font("Poppins", 24F, FontStyle.Bold),
                ForeColor = NoorGreen,
                AutoSize = true,
                Location = new Point(0, 250),
                Width = pnlMain.Width,
                TextAlign = ContentAlignment.MiddleCenter
            };
            lblTitle.Location = new Point((pnlMain.Width - lblTitle.PreferredWidth) / 2, 250);

            // Environment panel - Compact info card
            var pnlEnv = new Panel
            {
                Location = new Point(40, 310),
                Size = new Size(pnlMain.Width - 80, 70),
                BackColor = NoorBeige,
                BorderStyle = BorderStyle.None,
                Padding = new Padding(16)
            };
            pnlEnv.Paint += (s, e) => DrawRoundedPanel(e.Graphics, pnlEnv, 12, NoorBeige, NoorGold);

            lblEnvironment = new Label
            {
                Location = new Point(16, 15),
                AutoSize = true,
                Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
                ForeColor = NoorBrown
            };

            lblDatabase = new Label
            {
                Location = new Point(16, 40),
                AutoSize = true,
                Font = new Font("Segoe UI", 9F),
                ForeColor = NoorBrown
            };

            pnlEnv.Controls.Add(lblEnvironment);
            pnlEnv.Controls.Add(lblDatabase);

            // Session ID input panel - Modern input card
            var pnlInput = new Panel
            {
                Location = new Point(40, 400),
                Size = new Size(pnlMain.Width - 80, 150),
                BackColor = NoorBeige,
                BorderStyle = BorderStyle.None,
                Padding = new Padding(20)
            };
            pnlInput.Paint += (s, e) => DrawRoundedPanel(e.Graphics, pnlInput, 16, NoorBeige, NoorGold);

            var lblSessionId = new Label
            {
                Text = "Session ID",
                Location = new Point(20, 20),
                AutoSize = true,
                Font = new Font("Segoe UI", 11F, FontStyle.Bold),
                ForeColor = NoorBrown
            };

            txtSessionId = new TextBox
            {
                Location = new Point(20, 50),
                Size = new Size(pnlInput.Width - 40, 32),
                Font = new Font("Segoe UI", 13F),
                TextAlign = HorizontalAlignment.Center,
                BorderStyle = BorderStyle.FixedSingle
            };

            btnGenerate = new Button
            {
                Text = "🔐 Generate Tokens",
                Location = new Point(20, 95),
                Size = new Size(pnlInput.Width - 40, 45),
                BackColor = NoorGreen,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 11F, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnGenerate.FlatAppearance.BorderSize = 0;
            btnGenerate.Click += BtnGenerate_Click;
            btnGenerate.MouseEnter += (s, e) => btnGenerate.BackColor = Color.FromArgb(0, 80, 0);
            btnGenerate.MouseLeave += (s, e) => btnGenerate.BackColor = NoorGreen;

            pnlInput.Controls.Add(lblSessionId);
            pnlInput.Controls.Add(txtSessionId);
            pnlInput.Controls.Add(btnGenerate);

            // Host Token panel - Modern token display
            var pnlHost = new Panel
            {
                Location = new Point(40, 570),
                Size = new Size(pnlMain.Width - 80, 90),
                BackColor = Color.White,
                BorderStyle = BorderStyle.None,
                Padding = new Padding(16),
                Visible = false
            };
            pnlHost.Paint += (s, e) => DrawRoundedPanel(e.Graphics, pnlHost, 12, Color.White, NoorGold);

            var lblHost = new Label
            {
                Text = "Host Token",
                Location = new Point(16, 15),
                AutoSize = true,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                ForeColor = NoorBrown
            };

            txtHostToken = new TextBox
            {
                Location = new Point(16, 45),
                Size = new Size(pnlHost.Width - 110, 32),
                ReadOnly = true,
                Font = new Font("Consolas", 10F),
                BackColor = NoorBeige,
                BorderStyle = BorderStyle.FixedSingle
            };

            btnCopyHost = new Button
            {
                Text = "📋 Copy",
                Location = new Point(pnlHost.Width - 90, 45),
                Size = new Size(75, 32),
                BackColor = NoorGreen,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnCopyHost.FlatAppearance.BorderSize = 0;
            btnCopyHost.Click += (s, e) => CopyToClipboard(txtHostToken.Text, "Host token");
            btnCopyHost.MouseEnter += (s, e) => btnCopyHost.BackColor = Color.FromArgb(0, 80, 0);
            btnCopyHost.MouseLeave += (s, e) => btnCopyHost.BackColor = NoorGreen;

            pnlHost.Controls.Add(lblHost);
            pnlHost.Controls.Add(txtHostToken);
            pnlHost.Controls.Add(btnCopyHost);

            // User Token panel - Modern token display
            var pnlUser = new Panel
            {
                Location = new Point(40, 675),
                Size = new Size(pnlMain.Width - 80, 90),
                BackColor = Color.White,
                BorderStyle = BorderStyle.None,
                Padding = new Padding(16),
                Visible = false
            };
            pnlUser.Paint += (s, e) => DrawRoundedPanel(e.Graphics, pnlUser, 12, Color.White, NoorGold);

            var lblUser = new Label
            {
                Text = "User Token",
                Location = new Point(16, 15),
                AutoSize = true,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                ForeColor = NoorBrown
            };

            txtUserToken = new TextBox
            {
                Location = new Point(16, 45),
                Size = new Size(pnlUser.Width - 110, 32),
                ReadOnly = true,
                Font = new Font("Consolas", 10F),
                BackColor = NoorBeige,
                BorderStyle = BorderStyle.FixedSingle
            };

            btnCopyUser = new Button
            {
                Text = "📋 Copy",
                Location = new Point(pnlUser.Width - 90, 45),
                Size = new Size(75, 32),
                BackColor = NoorGreen,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnCopyUser.FlatAppearance.BorderSize = 0;
            btnCopyUser.Click += (s, e) => CopyToClipboard(txtUserToken.Text, "User token");
            btnCopyUser.MouseEnter += (s, e) => btnCopyUser.BackColor = Color.FromArgb(0, 80, 0);
            btnCopyUser.MouseLeave += (s, e) => btnCopyUser.BackColor = NoorGreen;

            pnlUser.Controls.Add(lblUser);
            pnlUser.Controls.Add(txtUserToken);
            pnlUser.Controls.Add(btnCopyUser);

            // Status label
            lblStatus = new Label
            {
                Location = new Point(40, pnlMain.Height - 40),
                Size = new Size(pnlMain.Width - 80, 25),
                Font = new Font("Segoe UI", 9.5F),
                ForeColor = NoorBrown,
                TextAlign = ContentAlignment.MiddleCenter
            };

            // Add all controls to main panel
            pnlMain.Controls.Add(picLogo);
            pnlMain.Controls.Add(lblTitle);
            pnlMain.Controls.Add(pnlEnv);
            pnlMain.Controls.Add(pnlInput);
            pnlMain.Controls.Add(pnlHost);
            pnlMain.Controls.Add(pnlUser);
            pnlMain.Controls.Add(lblStatus);

            // Add main panel to form
            this.Controls.Add(pnlMain);

            // Store references to panels for visibility toggling
            this.Tag = new { HostPanel = pnlHost, UserPanel = pnlUser };
        }

        // [DEBUG-WORKITEM:host-provisioner-form:styling] Custom rounded panel drawing with border
        private void DrawRoundedPanel(Graphics g, Panel panel, int radius, Color backgroundColor, Color borderColor)
        {
            g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
            
            using (var path = GetRoundedRectPath(new Rectangle(0, 0, panel.Width - 1, panel.Height - 1), radius))
            {
                // Fill background
                using (var brush = new SolidBrush(backgroundColor))
                {
                    g.FillPath(brush, path);
                }
                
                // Draw border
                using (var pen = new Pen(borderColor, 2))
                {
                    g.DrawPath(pen, path);
                }
            }
        }

        private System.Drawing.Drawing2D.GraphicsPath GetRoundedRectPath(Rectangle rect, int radius)
        {
            var path = new System.Drawing.Drawing2D.GraphicsPath();
            int diameter = radius * 2;
            
            path.AddArc(rect.X, rect.Y, diameter, diameter, 180, 90);
            path.AddArc(rect.Right - diameter, rect.Y, diameter, diameter, 270, 90);
            path.AddArc(rect.Right - diameter, rect.Bottom - diameter, diameter, diameter, 0, 90);
            path.AddArc(rect.X, rect.Bottom - diameter, diameter, diameter, 90, 90);
            path.CloseFigure();
            
            return path;
        }

        private void ShowEnvironmentInfo()
        {
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
            var connectionString = HostProvisionerConfig.GetConnectionStringForDisplay(environment);
            var dbName = HostProvisionerConfig.ExtractDatabaseName(connectionString);

            lblEnvironment.Text = $"Environment: {environment}";
            lblDatabase.Text = $"Database: {dbName}";
        }

        private async void BtnGenerate_Click(object? sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtSessionId.Text))
            {
                MessageBox.Show("Please enter a Session ID", "Input Required", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            if (!int.TryParse(txtSessionId.Text, out int sessionId))
            {
                MessageBox.Show("Session ID must be a valid number", "Invalid Input", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            btnGenerate.Enabled = false;
            lblStatus.Text = "Generating tokens...";
            lblStatus.ForeColor = NoorBrown;

            try
            {
                // [DEBUG-WORKITEM:host-provisioner-form:generate] Token generation logic
                var (hostToken, userToken) = await GenerateTokensAsync(sessionId);

                txtHostToken.Text = hostToken;
                txtUserToken.Text = userToken;

                // Show result panels
                var panels = (dynamic)this.Tag!;
                ((Panel)panels.HostPanel).Visible = true;
                ((Panel)panels.UserPanel).Visible = true;

                lblStatus.Text = "✓ Tokens generated successfully!";
                lblStatus.ForeColor = NoorGreen;
            }
            catch (Exception ex)
            {
                lblStatus.Text = "✗ Error: " + ex.Message;
                lblStatus.ForeColor = Color.Red;
                MessageBox.Show($"Error generating tokens:\n\n{ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                btnGenerate.Enabled = true;
            }
        }

        private async Task<(string hostToken, string userToken)> GenerateTokensAsync(int sessionId)
        {
            using var scope = _serviceProvider.CreateScope();
            var tokenService = scope.ServiceProvider.GetRequiredService<SimplifiedTokenService>();
            var dbContext = scope.ServiceProvider.GetRequiredService<SimplifiedCanvasDbContext>();
            var ksessionsContext = scope.ServiceProvider.GetRequiredService<KSessionsDbContext>();

            // Validate session exists in KSESSIONS
            var sessionExists = await ksessionsContext.Sessions.AnyAsync(s => s.SessionId == sessionId);
            if (!sessionExists)
            {
                throw new Exception($"Session ID {sessionId} does not exist in the database");
            }

            // Verify session has transcripts
            var transcriptCount = await ksessionsContext.SessionTranscripts
                .CountAsync(st => st.SessionId == sessionId);
                
            if (transcriptCount == 0)
            {
                throw new Exception($"Session ID {sessionId} has no transcripts available");
            }

            // Check if canvas.Sessions record exists
            var existingSession = await dbContext.Sessions.FirstOrDefaultAsync(s => s.SessionId == sessionId);
            NoorCanvas.Models.Simplified.Session canvasSession;
            
            if (existingSession == null)
            {
                // Create simplified canvas.Sessions record
                canvasSession = new NoorCanvas.Models.Simplified.Session
                {
                    SessionId = sessionId,
                    AlbumId = Guid.NewGuid(),
                    Status = "Created",
                    CreatedAt = DateTime.UtcNow,
                    HostToken = "",
                    UserToken = "",
                    ExpiresAt = DateTime.UtcNow.AddHours(24),
                    CreatedBy = "WinForms Host Provisioner"
                };
                
                dbContext.Sessions.Add(canvasSession);
                await dbContext.SaveChangesAsync();
            }
            else
            {
                canvasSession = existingSession;
            }

            // Generate friendly tokens using SimplifiedTokenService
            var (generatedHostToken, generatedUserToken) = await tokenService.GenerateTokenPairForSessionAsync(
                canvasSession.SessionId, 
                validHours: 24,
                clientIp: "127.0.0.1");

            return (generatedHostToken, generatedUserToken);
        }

        private void CopyToClipboard(string text, string label)
        {
            try
            {
                Clipboard.SetText(text);
                lblStatus.Text = $"✓ {label} copied to clipboard!";
                lblStatus.ForeColor = NoorGreen;
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to copy to clipboard:\n{ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
