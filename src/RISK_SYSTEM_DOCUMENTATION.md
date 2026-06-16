# ⚡ XFunded Trader — Risk Management System

## 🎯 Overview

Complete institutional-grade risk management system providing FTMO-level (or better) monitoring, detection, and enforcement capabilities. This is an **extra security layer** for admins/fund owners to track accounts, users, and audit trading behavior — **does not replace** automated breach detection.

---

## 📊 CATEGORY 1 — Risk Score Engine

### ChallengeAccount Entity Updates
- `risk_score` (0-100) — Calculated automatically
- `risk_level` — low | medium | high | critical
- `risk_flags` — Array of active violation types
- `last_risk_scan` — Timestamp of last calculation
- `can_trade` — Auto-set to false if risk_score >= 81

### Scoring Rules
| Violation | Points |
|-----------|--------|
| HFT detected | +25 |
| Arbitrage detected | +35 |
| EA/Bot trading | +25 |
| Inconsistent behavior | +15 |
| VPN/Proxy detected | +20 |
| Multiple accounts | +30 |

### Auto-Actions
- **81+ score**: `can_trade = false` (suspended)
- **61+ score**: Admin alert notification
- **3+ flags**: Manual review required

---

## 🔍 CATEGORY 2 — HFT Detection

### Detection Rules
- **Avg trade duration < 2 min** → Flag
- **Trades per day > 40** → Flag
- **% trades under 60s > 25%** → Flag
- **Fastest trade < 10 seconds** → Flag

### Backend Function: `automatedRiskScan`
Analyzes all closed trades calculating:
- Average hold time in seconds
- Percentage of ultra-short trades
- Maximum trades per minute
- HFT confidence score (0-100)

---

## 🤖 CATEGORY 3 — EA/Bot Detection

### Pattern Analysis
1. **Lot Size Pattern** — 90%+ identical lots = bot
2. **Mechanical Timing** — 70%+ at exact minute marks = bot
3. **Identical SL/TP** — 80%+ same pip distances = bot
4. **Perfect R:R** — Every trade exact ratio = bot
5. **24/7 Trading** — No sleep pattern = bot
6. **Zero Hesitation** — 95%+ close at exact SL/TP = bot

### Stored Data
- `ea_bot_score` (0-100)
- `ea_bot_detected` (boolean)
- `ea_bot_evidence` (JSON with detailed proof)

---

## ⚖️ CATEGORY 4 — Arbitrage Detection

### Cross-Account Hedge Detection
Finds trades across ALL accounts where:
- Same symbol + opposite direction
- Within 5 seconds of each other
- Similar lot sizes (within 10%)

### Latency Arbitrage
- Entry price vs market price gap > 2 pips
- Win rate on first trade > 85%

---

## 🌐 CATEGORY 5 — IP & Device Tracking

### DeviceLog Entity
Tracks on EVERY login and trade:
- IP address, device fingerprint
- Browser, OS, screen resolution
- Country from IP
- VPN/Proxy/Datacenter flags

### VPN Detection
Uses ip-api.com to check:
- `proxy=true` → VPN flag
- `hosting=true` → Datacenter flag
- Country ≠ KYC country → Mismatch flag

### Multiple Account Detection
- Same IP across 2+ emails → Flag both
- Same device fingerprint → High confidence

### IPBlacklist Entity
- Block IPs with reason and admin notes

---

## 📈 CATEGORY 6 — Behavioral Analytics

### Behavioral Fingerprint
Calculates per account:
- Preferred sessions (London/NY/Asian)
- Preferred pairs
- Avg hold time
- Avg lot size
- Risk per trade %
- Trading hours
- Win rate & R:R ratio

### Account Passing Detection
Compares Phase 1 vs Funded fingerprints:
- Session change > 50% → Flag
- Hold time drastic change → Flag
- Different primary pairs → Flag
- Win rate drop 70% → 35% → Flag
- Trading hours shift 6+ hours → Flag

### Consistency Score (0-100)
- Risk per trade consistency: 30%
- Trading hours consistency: 20%
- Session consistency: 20%
- Pairs consistency: 15%
- Hold time consistency: 15%

---

## 🏦 CATEGORY 7 — Firm Exposure Monitor

**COMING SOON** — Real-time aggregation of ALL open positions across funded accounts showing:
- Net exposure per currency pair
- Total long/short volume
- Number of accounts exposed
- Firm liability if price moves 1%
- Concentration risk alerts

---

## 🪪 CATEGORY 8 — KYC Fraud Detection

**COMING SOON** — Enhanced KYC checks:
- Duplicate ID detection
- Document authenticity checklist
- IP country vs KYC country mismatch
- Sanctions screening (OFAC SDN list)
- Age verification

---

## 🎛️ Admin Risk Center UI

### Location
**Dashboard → Admin → Risk Center**

### KPI Cards (Top Row)
- Total Accounts Monitored
- High Risk Accounts (score 61+)
- Critical Risk (score 81+)
- Accounts Scanned (last 24h)
- Suspended Accounts

### Navigation Tabs
1. **Overview** — Risk score leaderboard
2. **HFT Detection** — Trade frequency analysis
3. **EA/Bot** — Pattern detection results
4. **Arbitrage** — Cross-account hedge monitoring
5. **IP & Device** — VPN/proxy tracking
6. **Behavioral** — Consistency & fingerprint
7. **Firm Exposure** — Aggregate risk (coming)
8. **KYC Review** — Fraud detection (coming)

### Overview Table Columns
- Trader / Account ID
- Risk Score (0-100 gauge)
- Risk Level badge
- Active flag pills
- Last scan timestamp
- Actions: View | Warn | Suspend | Terminate

---

## ⚡ Backend Functions

### `automatedRiskScan`
**Purpose:** Scan all accounts or specific account for risk violations

**Usage:**
```javascript
// Scan all accounts
await base44.functions.invoke('automatedRiskScan', {});

// Scan specific account
await base44.functions.invoke('automatedRiskScan', { account_id: 'ACC123' });
```

**Returns:**
```json
{
  "success": true,
  "scanned": 45,
  "high_risk": 3,
  "results": [
    {
      "account_id": "ACC123",
      "risk_score": 85,
      "risk_level": "critical",
      "risk_flags": ["hft_detected", "bot_detected"],
      "evidence": { ... }
    }
  ]
}
```

### `sendRiskWarning`
**Purpose:** Send notification to trader about risk review

**Usage:**
```javascript
await base44.functions.invoke('sendRiskWarning', {
  user_email: 'trader@example.com',
  account_id: 'ACC123',
  reason: 'HFT trading pattern detected'
});
```

---

## 🔐 Admin Actions

### Manual Enforcement (No Auto-Breach)
Risk System provides **manual control only**:

1. **Warn Trader** — Send notification
2. **Suspend Trading** — Set `can_trade = false`
3. **Terminate Account** — Set status = 'failed'
4. **View Evidence** — Detailed violation proof

### Audit Logging
Every action logged in `RiskAuditLog` entity:
- Admin email
- Action category
- Target account
- Risk score before/after
- Reason & details
- Timestamp

---

## 🔄 Automated Scanning

### When Risk Score Calculates
- Every 5 minutes (via `scheduledMTSync`)
- On new trade detection
- On login from new IP/device

### Integration with Existing Systems
- **scheduledMTSync** — Calls risk scan for each account
- **mt5RealtimeSync** — Triggers scan on large equity changes
- **phaseProgressionEngine** — Scans before phase approval

---

## 📋 Risk Flags Reference

| Flag | Description | Points |
|------|-------------|--------|
| `hft_detected` | High-frequency trading | 25 |
| `bot_detected` | EA/automated trading | 25 |
| `arbitrage_detected` | Risk-free hedging | 35 |
| `inconsistent_behavior` | Account passing suspected | 15 |
| `vpn_detected` | VPN/proxy usage | 20 |
| `ip_mismatch` | Country ≠ KYC | 20 |
| `multiple_accounts` | Same IP/device | 30 |

---

## 🎯 Risk Level Thresholds

| Score | Level | Color | Action |
|-------|-------|-------|--------|
| 0-30 | Low | Green | Normal trading |
| 31-60 | Medium | Yellow | Monitor closely |
| 61-80 | High | Red | Admin alert |
| 81+ | Critical | Dark Red | Auto-suspend |

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] Risk score calculates correctly for test account
- [ ] HFT detection catches avg trade < 2 min
- [ ] Bot detection identifies round lot patterns
- [ ] Cross-account arbitrage query works
- [ ] IP tracking records every login
- [ ] Behavioral fingerprint generates
- [ ] Admin alerts fire at thresholds
- [ ] Auto-suspend works at score 81
- [ ] Manual actions (warn/suspend/terminate) work
- [ ] Audit logs capture all admin actions

---

## 🚀 Next Steps (Enhancements)

1. **Firm Exposure Dashboard** — Aggregate all positions
2. **KYC Fraud Detection** — Duplicate checks, sanctions
3. **Real-time Alerts** — WebSocket push notifications
4. **Risk Heatmap** — Visual geographic risk distribution
5. **Machine Learning** — Anomaly detection model
6. **Trade Voiding** — Admin can void suspicious trades
7. **Withdrawal Block** — Prevent payouts for high-risk accounts

---

## 📞 Support

For questions or issues with the Risk Management System:
- **Dashboard → Admin → Risk Center**
- Check `RiskAuditLog` entity for action history
- Review backend function logs in Code → Functions

---

**Built for XFunded Trader — Prove Your Edge. Get Funded.**