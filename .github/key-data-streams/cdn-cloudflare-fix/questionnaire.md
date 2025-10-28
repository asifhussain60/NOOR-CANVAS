# Questionnaire: cdn-cloudflare-fix

**Status**: Awaiting Answers  
**Created**: 2025-10-26 14:15:00  
**Plan Version**: 1.0

---

## Instructions

1. **Mark your choice** with an `X` between the brackets: `[X]`
2. **Save the file** after marking answers
3. **Tell agent** "questionnaire complete" to continue planning

---

## Questions

### Q1: Server Public IP Configuration

**Why we're asking**: We need to know your network setup to determine if direct IIS hosting is viable or if we need an alternative approach.

**Options** (mark ONE with X):
- [ ] **A.** Server has static public IP (best for direct hosting)
  - *Pros*: Direct DNS → IIS, no tunnel needed, simple setup
  - *Cons*: None
  - *Effort*: Low (just DNS A record)

- [ ] **B.** Server has dynamic public IP (requires DDNS)
  - *Pros*: Still works with DDNS service, no tunnel needed
  - *Cons*: Need DDNS client, IP may change periodically
  - *Effort*: Medium (setup DDNS service)

- [X] **C.** Server is behind NAT without port forwarding access
  - *Pros*: None for direct hosting
  - *Cons*: Cannot use direct IIS, must use tunnel or proxy
  - *Effort*: High (requires Cloudflare tunnel or ngrok)

**Your Answer**: **C** - Behind NAT (LAN: 192.168.1.158, WAN: 98.221.185.102, using Cloudflare tunnel)

---

### Q2: Windows Firewall Port 443 Status

**Why we're asking**: HTTPS requires port 443 open. If already configured, we can skip firewall configuration phase.

**Options** (mark ONE with X):
- [X] **A.** Port 443 already open (inbound HTTPS allowed)
  - *Pros*: Skip firewall config, faster deployment
  - *Cons*: None
  - *Effort*: None (already configured)

- [ ] **B.** Port 443 blocked, can open manually
  - *Pros*: Full control over firewall rules
  - *Cons*: Requires admin access, manual PowerShell commands
  - *Effort*: Low (5-minute task)

- [ ] **C.** Port 443 blocked, need IT/hosting provider to open
  - *Pros*: Secure managed environment
  - *Cons*: Delays deployment, external dependency
  - *Effort*: Medium (depends on IT response time)

**Your Answer**: **A** - Port 443 listening (confirmed via Test-NetConnection)

---

### Q3: SSL Certificate Method

**Why we're asking**: Different SSL methods have different trade-offs for security, automation, and maintenance.

**Options** (mark ONE with X):
- [ ] **A.** Let's Encrypt with win-acme (recommended)
  - *Pros*: Free, auto-renewal, trusted by all browsers, ACME protocol standard
  - *Cons*: Requires port 80 for HTTP-01 challenge, 90-day expiry (auto-renews)
  - *Effort*: Medium (install win-acme, configure renewal task)

- [X] **B.** Cloudflare Origin Certificate
  - *Pros*: Free, 15-year validity, no port 80 needed, instant issuance
  - *Cons*: Only trusted by Cloudflare (requires Cloudflare proxy), not browser-trusted
  - *Effort*: Low (download cert, import to IIS)

- [ ] **C.** Self-signed certificate (testing only)
  - *Pros*: Instant, no dependencies, works for dev/test
  - *Cons*: Browser warnings, not trusted, not for production
  - *Effort*: Low (PowerShell script)

**Your Answer**: **B** - Cloudflare Origin Certificates already created (expires Oct 19, 2060 per screenshot)

---

## Answered Questions Archive

<details>
<summary>Previously Answered (click to expand)</summary>

### ✅ Q1: Server Public IP Configuration (Answered: 2025-10-26)
**Chosen**: C - Server behind NAT (LAN: 192.168.1.158, WAN: 98.221.185.102, using Cloudflare tunnel)
**Incorporated**: Plan v1.1 - Keep tunnel architecture, fix routing

### ✅ Q2: Windows Firewall Port 443 Status (Answered: 2025-10-26)
**Chosen**: A - Port 443 already listening (confirmed via Test-NetConnection)
**Incorporated**: Plan v1.1 - Skip firewall configuration phase

### ✅ Q3: SSL Certificate Method (Answered: 2025-10-26)
**Chosen**: B - Cloudflare Origin Certificates (expires Oct 19, 2060 per screenshot)
**Incorporated**: Plan v1.1, Phase 1-2 - Download and import existing certificates

</details>
