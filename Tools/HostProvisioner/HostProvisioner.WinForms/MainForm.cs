using System;
using System.Diagnostics; // [DEBUG-WORKITEM:host-provisioner-form:browser] For launching browser ;CLEANUP_OK
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
        private readonly string _baseUrl; // [DEBUG-WORKITEM:host-provisioner-form:baseurl] Store base URL for token display ;CLEANUP_OK
        private TextBox txtSessionId = null!;
        private Button btnGenerate = null!;
        private TextBox txtHostToken = null!;
        // [DEBUG-WORKITEM:host-provisioner:canvas-link-removal] User controls removed ;CLEANUP_OK
        private Button btnCopyHost = null!;
        private Button btnOpenHost = null!; // [DEBUG-WORKITEM:host-provisioner-form:browser] Open Host URL in browser ;CLEANUP_OK
        private Label lblStatus = null!;
        private Label lblEnvironment = null!;
        private Label lblBaseUrl = null!; // Separate label for Base URL
        private Label lblDatabase = null!;

        // [TRACE:host-provisioner:drag-support] Form dragging support ;CLEANUP_OK
        private bool _isDragging = false;
        private Point _dragStartPoint;

        public MainForm()
        {
            // [DEBUG-WORKITEM:host-provisioner-form:config] Initialize services with centralized config
            var services = new ServiceCollection();
            
            // Detect environment using centralized logic
            var (environment, baseUrl) = HostProvisionerConfig.DetectEnvironment("HostProvisioner.WinForms.dll.config");
            _baseUrl = baseUrl; // [DEBUG-WORKITEM:host-provisioner-form:baseurl] Store for token URL generation ;CLEANUP_OK
            
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
            this.Size = new Size(550, 650); // [DEBUG-WORKITEM:host-provisioner:spacing] Reduced height to remove empty space ;CLEANUP_OK
            this.BackColor = NoorBeige;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.None; // [TRACE:host-provisioner:drag-support] Remove border for custom header ;CLEANUP_OK
            this.MaximizeBox = false;
            this.Font = new Font("Segoe UI", 9F);
            this.Padding = new Padding(30);

            // [TRACE:host-provisioner:drag-support] Add draggable header bar ;CLEANUP_OK
            var pnlHeader = new Panel
            {
                Location = new Point(0, 0),
                Size = new Size(this.ClientSize.Width, 50),
                BackColor = NoorGreen,
                BorderStyle = BorderStyle.None,
                Cursor = Cursors.SizeAll
            };

            var lblHeaderTitle = new Label
            {
                Text = "⚙ NOOR Canvas Host Provisioner",
                Location = new Point(20, 12),
                AutoSize = true,
                Font = new Font("Segoe UI", 12F, FontStyle.Bold),
                ForeColor = Color.White,
                BackColor = Color.Transparent,
                Cursor = Cursors.SizeAll
            };

            var btnClose = new Button
            {
                Text = "✕",
                Location = new Point(this.ClientSize.Width - 50, 10),
                Size = new Size(40, 30),
                BackColor = Color.Transparent,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 14F, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnClose.FlatAppearance.BorderSize = 0;
            btnClose.FlatAppearance.MouseOverBackColor = Color.FromArgb(180, 0, 0);
            btnClose.Click += (s, e) => this.Close();

            // [TRACE:host-provisioner:drag-support] Wire up drag events for header and title ;CLEANUP_OK
            pnlHeader.MouseDown += Header_MouseDown;
            pnlHeader.MouseMove += Header_MouseMove;
            pnlHeader.MouseUp += Header_MouseUp;
            lblHeaderTitle.MouseDown += Header_MouseDown;
            lblHeaderTitle.MouseMove += Header_MouseMove;
            lblHeaderTitle.MouseUp += Header_MouseUp;

            pnlHeader.Controls.Add(lblHeaderTitle);
            pnlHeader.Controls.Add(btnClose);
            this.Controls.Add(pnlHeader);

            // Main container panel - Card with shadow effect
            var pnlMain = new Panel
            {
                Location = new Point(30, 80), // [TRACE:host-provisioner:drag-support] Adjusted for header ;CLEANUP_OK
                Size = new Size(this.ClientSize.Width - 60, this.ClientSize.Height - 110), // [DEBUG-WORKITEM:host-provisioner:spacing] Height adjusted for reduced form ;CLEANUP_OK
                BackColor = Color.White,
                BorderStyle = BorderStyle.None,
                Padding = new Padding(0),
                AutoScroll = true // [DEBUG-WORKITEM:host-provisioner:scroll-tokens] Re-enabled AutoScroll for token visibility ;CLEANUP_OK
            };
            pnlMain.Paint += (s, e) => DrawRoundedPanel(e.Graphics, pnlMain, 24, Color.White, NoorGold);

            // Logo - [TRACE:host-provisioner:logo-resize] Reduced from 200x200 to 100x100 ;CLEANUP_OK
            var picLogo = new PictureBox
            {
                Size = new Size(100, 100),
                Location = new Point((pnlMain.Width - 100) / 2, 30),
                SizeMode = PictureBoxSizeMode.Zoom
            };

            try
            {
                // Use correct logo from web app resources
                var logoPath = @"D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\wwwroot\images\NoorCanvas.png";
                if (File.Exists(logoPath))
                {
                    picLogo.Image = Image.FromFile(logoPath);
                    picLogo.BackColor = Color.Transparent; // Handle transparency properly
                }
            }
            catch (Exception ex)
            {
                // [DEBUG-WORKITEM:host-provisioner-form:logo] Logo loading failed
                Console.WriteLine($"Logo loading failed: {ex.Message}");
            }

            // Title - [TRACE:host-provisioner:logo-resize] Adjusted position for smaller logo ;CLEANUP_OK
            var lblTitle = new Label
            {
                Text = "Host Provisioner",
                Font = new Font("Poppins", 24F, FontStyle.Bold),
                ForeColor = NoorGreen,
                AutoSize = true,
                Location = new Point(0, 150),
                Width = pnlMain.Width,
                TextAlign = ContentAlignment.MiddleCenter
            };
            lblTitle.Location = new Point((pnlMain.Width - lblTitle.PreferredWidth) / 2, 150);

            // Environment panel - Compact info card (increased height for two lines)
            var pnlEnv = new Panel
            {
                Location = new Point(40, 210), // [TRACE:host-provisioner:logo-resize] Adjusted from 310 for smaller logo ;CLEANUP_OK
                Size = new Size(pnlMain.Width - 80, 85), // Increased from 70 to 85 for two lines
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

            // Add separate label for Base URL on new line
            lblBaseUrl = new Label
            {
                Location = new Point(16, 35),
                AutoSize = true,
                Font = new Font("Segoe UI", 9F),
                ForeColor = NoorBrown
            };

            lblDatabase = new Label
            {
                Location = new Point(16, 55), // Moved down from 40 to 55
                AutoSize = true,
                Font = new Font("Segoe UI", 9F),
                ForeColor = NoorBrown
            };

            pnlEnv.Controls.Add(lblEnvironment);
            pnlEnv.Controls.Add(lblBaseUrl); // Add Base URL label
            pnlEnv.Controls.Add(lblDatabase);

            // Session ID input panel - Modern input card (increased padding)
            var pnlInput = new Panel
            {
                Location = new Point(40, 315), // [TRACE:host-provisioner:logo-resize] Adjusted from 415 for smaller logo ;CLEANUP_OK
                Size = new Size(pnlMain.Width - 80, 150),
                BackColor = NoorBeige,
                BorderStyle = BorderStyle.None,
                Padding = new Padding(24) // Increased from 20 to 24
            };
            pnlInput.Paint += (s, e) => DrawRoundedPanel(e.Graphics, pnlInput, 16, NoorBeige, NoorGold);

            var lblSessionId = new Label
            {
                Text = "Session ID",
                Location = new Point(24, 24), // Adjusted for new padding
                AutoSize = true,
                Font = new Font("Segoe UI", 11F, FontStyle.Bold),
                ForeColor = NoorBrown
            };

            txtSessionId = new TextBox
            {
                Location = new Point(24, 54), // Adjusted for new padding
                Size = new Size(pnlInput.Width - 48, 32), // Adjusted for new padding (24*2=48)
                Font = new Font("Segoe UI", 13F),
                TextAlign = HorizontalAlignment.Center,
                BorderStyle = BorderStyle.FixedSingle
            };
            // [DEBUG-WORKITEM:host-provisioner:enter-key] Add Enter key handler to trigger token generation ;CLEANUP_OK
            txtSessionId.KeyDown += (s, e) => {
                if (e.KeyCode == Keys.Enter)
                {
                    e.SuppressKeyPress = true; // Prevent beep sound
                    btnGenerate.PerformClick();
                }
            };

            btnGenerate = new Button
            {
                Text = "🔐 Generate Tokens",
                Location = new Point(24, 99), // Adjusted for new padding
                Size = new Size(pnlInput.Width - 48, 45), // Adjusted for new padding
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
                Location = new Point(40, 485), // [TRACE:host-provisioner:logo-resize] Adjusted from 585 for smaller logo ;CLEANUP_OK
                Size = new Size(pnlMain.Width - 80, 90),
                BackColor = Color.White,
                BorderStyle = BorderStyle.None,
                Padding = new Padding(16),
                Visible = false
            };
            pnlHost.Paint += (s, e) => DrawRoundedPanel(e.Graphics, pnlHost, 12, Color.White, NoorGold);

            var lblHost = new Label
            {
                Text = "Host URL", // [DEBUG-WORKITEM:host-provisioner-form:baseurl] Changed label to URL ;CLEANUP_OK
                Location = new Point(16, 15),
                AutoSize = true,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                ForeColor = NoorBrown
            };

            txtHostToken = new TextBox
            {
                Location = new Point(16, 45),
                Size = new Size(pnlHost.Width - 210, 32), // Increased from 200 to 210 to reduce button overlap
                ReadOnly = true,
                Font = new Font("Consolas", 8.5F), // Reduced from 9F to 8.5F for better fit
                BackColor = NoorBeige,
                BorderStyle = BorderStyle.FixedSingle
            };

            btnCopyHost = new Button
            {
                Text = "📋",
                Location = new Point(pnlHost.Width - 185, 45), // Adjusted position for tighter spacing
                Size = new Size(85, 32), // Increased from 75 to 85 for touch target
                BackColor = NoorGreen,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                Cursor = Cursors.Hand
            };
            btnCopyHost.FlatAppearance.BorderSize = 0;
            btnCopyHost.Click += (s, e) => CopyToClipboard(txtHostToken.Text, "Host URL"); // [DEBUG-WORKITEM:host-provisioner-form:baseurl] Updated label ;CLEANUP_OK
            btnCopyHost.MouseEnter += (s, e) => btnCopyHost.BackColor = Color.FromArgb(0, 80, 0);
            btnCopyHost.MouseLeave += (s, e) => btnCopyHost.BackColor = NoorGreen;

            // [DEBUG-WORKITEM:host-provisioner-form:browser] Add Open button for Host URL ;CLEANUP_OK
            btnOpenHost = new Button
            {
                Text = "🌐",
                Location = new Point(pnlHost.Width - 90, 45),
                Size = new Size(75, 32),
                BackColor = NoorGreen,
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 11F, FontStyle.Bold), // Larger icon
                Cursor = Cursors.Hand
            };
            btnOpenHost.FlatAppearance.BorderSize = 0;
            btnOpenHost.Click += (s, e) => OpenUrlInBrowser(txtHostToken.Text);
            btnOpenHost.MouseEnter += (s, e) => btnOpenHost.BackColor = Color.FromArgb(0, 80, 0);
            btnOpenHost.MouseLeave += (s, e) => btnOpenHost.BackColor = NoorGreen;

            pnlHost.Controls.Add(lblHost);
            pnlHost.Controls.Add(txtHostToken);
            pnlHost.Controls.Add(btnCopyHost);
            pnlHost.Controls.Add(btnOpenHost); // [DEBUG-WORKITEM:host-provisioner-form:browser] Add Open button to panel ;CLEANUP_OK

            // [DEBUG-WORKITEM:host-provisioner:canvas-link-removal] User Token panel removed - only showing host landing page ;CLEANUP_OK

            // Status label
            // [DEBUG-WORKITEM:host-provisioner:spacing] Position adjusted for reduced form height ;CLEANUP_OK
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
            // [DEBUG-WORKITEM:host-provisioner:canvas-link-removal] User panel removed ;CLEANUP_OK
            pnlMain.Controls.Add(lblStatus);

            // Add main panel to form
            this.Controls.Add(pnlMain);

            // Store references to panels for visibility toggling
            // [DEBUG-WORKITEM:host-provisioner:canvas-link-removal] Only host panel needed ;CLEANUP_OK
            this.Tag = new { HostPanel = pnlHost };
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

            // Split environment and base URL to separate lines
            lblEnvironment.Text = $"Environment: {environment}";
            lblBaseUrl.Text = $"Base URL: {_baseUrl}";
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

                // [DEBUG-WORKITEM:host-provisioner:canvas-link-removal] Only show host landing page URL ;CLEANUP_OK
                txtHostToken.Text = $"{_baseUrl}/host/{hostToken}";

                // Show result panels - only host panel
                var panels = (dynamic)this.Tag!;
                ((Panel)panels.HostPanel).Visible = true;
                // [DEBUG-WORKITEM:host-provisioner:canvas-link-removal] User panel removed ;CLEANUP_OK

                lblStatus.Text = "✓ Host token generated successfully!";
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
                // [DEBUG-WORKITEM:host-provisioner] Regenerate tokens and reset status for existing session ;CLEANUP_OK
                canvasSession = existingSession;
                canvasSession.Status = "Created";
                canvasSession.HostToken = "";  // Will be regenerated
                canvasSession.UserToken = "";  // Will be regenerated
                canvasSession.CreatedAt = DateTime.UtcNow;
                canvasSession.ExpiresAt = DateTime.UtcNow.AddHours(24);
                canvasSession.CreatedBy = "WinForms Host Provisioner";
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

        // [DEBUG-WORKITEM:host-provisioner-form:browser] Open URL in default browser ;CLEANUP_OK
        private void OpenUrlInBrowser(string url)
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                };
                Process.Start(psi);
                
                lblStatus.Text = "✓ Browser opened!";
                lblStatus.ForeColor = NoorGreen;
            }
            catch (Exception ex)
            {
                lblStatus.Text = "✗ Failed to open browser";
                lblStatus.ForeColor = Color.Red;
                MessageBox.Show($"Failed to open URL in browser:\n{ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        // [TRACE:host-provisioner:drag-support] Form dragging event handlers ;CLEANUP_OK
        private void Header_MouseDown(object? sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
            {
                _isDragging = true;
                _dragStartPoint = e.Location;
            }
        }

        private void Header_MouseMove(object? sender, MouseEventArgs e)
        {
            if (_isDragging)
            {
                Point newLocation = this.Location;
                newLocation.X += e.X - _dragStartPoint.X;
                newLocation.Y += e.Y - _dragStartPoint.Y;
                this.Location = newLocation;
            }
        }

        private void Header_MouseUp(object? sender, MouseEventArgs e)
        {
            _isDragging = false;
        }
    }
}
