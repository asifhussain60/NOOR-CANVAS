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
            // Form settings
            this.Text = "NOOR Canvas Host Provisioner";
            this.Size = new Size(500, 750);
            this.BackColor = NoorBeige;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.Font = new Font("Segoe UI", 9F);

            // Logo
            var picLogo = new PictureBox
            {
                Size = new Size(200, 200),
                Location = new Point((this.ClientSize.Width - 200) / 2, 20),
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
                Font = new Font("Poppins", 20F, FontStyle.Bold),
                ForeColor = NoorGreen,
                AutoSize = true,
                Location = new Point(0, 230),
                Width = this.ClientSize.Width,
                TextAlign = ContentAlignment.MiddleCenter
            };
            lblTitle.Location = new Point((this.ClientSize.Width - lblTitle.PreferredWidth) / 2, 230);

            // Environment panel
            var pnlEnv = new Panel
            {
                Location = new Point(40, 280),
                Size = new Size(this.ClientSize.Width - 80, 60),
                BackColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle
            };

            lblEnvironment = new Label
            {
                Location = new Point(10, 10),
                AutoSize = true,
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                ForeColor = NoorBrown
            };

            lblDatabase = new Label
            {
                Location = new Point(10, 35),
                AutoSize = true,
                Font = new Font("Segoe UI", 9F),
                ForeColor = NoorBrown
            };

            pnlEnv.Controls.Add(lblEnvironment);
            pnlEnv.Controls.Add(lblDatabase);

            // Session ID input panel
            var pnlInput = new Panel
            {
                Location = new Point(40, 360),
                Size = new Size(this.ClientSize.Width - 80, 120),
                BackColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle
            };

            var lblSessionId = new Label
            {
                Text = "Session ID",
                Location = new Point(10, 15),
                AutoSize = true,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                ForeColor = NoorBrown
            };

            txtSessionId = new TextBox
            {
                Location = new Point(10, 45),
                Size = new Size(pnlInput.Width - 20, 30),
                Font = new Font("Segoe UI", 12F),
                TextAlign = HorizontalAlignment.Center
            };

            btnGenerate = new Button
            {
                Text = "🔐 Generate Tokens",
                Location = new Point(10, 85),
                Size = new Size(pnlInput.Width - 20, 40),
                BackColor = NoorGreen,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnGenerate.FlatAppearance.BorderSize = 0;
            btnGenerate.Click += BtnGenerate_Click;

            pnlInput.Controls.Add(lblSessionId);
            pnlInput.Controls.Add(txtSessionId);
            pnlInput.Controls.Add(btnGenerate);

            // Host Token panel
            var pnlHost = new Panel
            {
                Location = new Point(40, 500),
                Size = new Size(this.ClientSize.Width - 80, 80),
                BackColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle,
                Visible = false
            };

            var lblHost = new Label
            {
                Text = "Host Token",
                Location = new Point(10, 10),
                AutoSize = true,
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                ForeColor = NoorBrown
            };

            txtHostToken = new TextBox
            {
                Location = new Point(10, 35),
                Size = new Size(pnlHost.Width - 90, 30),
                ReadOnly = true,
                Font = new Font("Consolas", 10F),
                BackColor = NoorBeige
            };

            btnCopyHost = new Button
            {
                Text = "Copy",
                Location = new Point(pnlHost.Width - 75, 35),
                Size = new Size(65, 30),
                BackColor = NoorGreen,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9F),
                Cursor = Cursors.Hand
            };
            btnCopyHost.FlatAppearance.BorderSize = 0;
            btnCopyHost.Click += (s, e) => CopyToClipboard(txtHostToken.Text, "Host token");

            pnlHost.Controls.Add(lblHost);
            pnlHost.Controls.Add(txtHostToken);
            pnlHost.Controls.Add(btnCopyHost);

            // User Token panel
            var pnlUser = new Panel
            {
                Location = new Point(40, 595),
                Size = new Size(this.ClientSize.Width - 80, 80),
                BackColor = Color.White,
                BorderStyle = BorderStyle.FixedSingle,
                Visible = false
            };

            var lblUser = new Label
            {
                Text = "User Token",
                Location = new Point(10, 10),
                AutoSize = true,
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                ForeColor = NoorBrown
            };

            txtUserToken = new TextBox
            {
                Location = new Point(10, 35),
                Size = new Size(pnlUser.Width - 90, 30),
                ReadOnly = true,
                Font = new Font("Consolas", 10F),
                BackColor = NoorBeige
            };

            btnCopyUser = new Button
            {
                Text = "Copy",
                Location = new Point(pnlUser.Width - 75, 35),
                Size = new Size(65, 30),
                BackColor = NoorGreen,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9F),
                Cursor = Cursors.Hand
            };
            btnCopyUser.FlatAppearance.BorderSize = 0;
            btnCopyUser.Click += (s, e) => CopyToClipboard(txtUserToken.Text, "User token");

            pnlUser.Controls.Add(lblUser);
            pnlUser.Controls.Add(txtUserToken);
            pnlUser.Controls.Add(btnCopyUser);

            // Status label
            lblStatus = new Label
            {
                Location = new Point(40, 690),
                Size = new Size(this.ClientSize.Width - 80, 30),
                Font = new Font("Segoe UI", 9F),
                ForeColor = NoorBrown,
                TextAlign = ContentAlignment.MiddleCenter
            };

            // Add all controls to form
            this.Controls.Add(picLogo);
            this.Controls.Add(lblTitle);
            this.Controls.Add(pnlEnv);
            this.Controls.Add(pnlInput);
            this.Controls.Add(pnlHost);
            this.Controls.Add(pnlUser);
            this.Controls.Add(lblStatus);

            // Store references to panels for visibility toggling
            this.Tag = new { HostPanel = pnlHost, UserPanel = pnlUser };
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
