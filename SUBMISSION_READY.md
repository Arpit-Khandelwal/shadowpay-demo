# ShadowPay - Hackathon Submission (COPY-PASTE READY)

## ⏰ DEADLINE: 11PM ET FEBRUARY 1ST

**Submit at**: https://solanafoundation.typeform.com/privacyhacksub

---

## 📋 FORM FIELDS (Copy-Paste Ready)

### Project Name
```
ShadowPay
```

### One-Line Description
```
Compliant private payroll for Solana - hide salaries on-chain while proving regulatory compliance via ZK proofs
```

### GitHub Repository
```
https://github.com/Arpit-Khandelwal/shadowpay-demo
```

### Live Demo URL
```
https://privacy-compliance-tool-arpitkhandelwals-projects.vercel.app
```

### Track/Category
```
DeFi / Payments
```

### Sponsor Bounties (Select these)
```
- Radr Labs (ShadowWire) - $15,000 pool
- Range - $1,500 pool
```

---

## 📝 TECHNICAL DESCRIPTION (Copy this entire block)

```
ShadowPay is a compliant private payroll solution built on Solana that enables businesses to pay employees without exposing salary amounts on-chain.

CORE TECHNOLOGIES:

1. ShadowWire (Radr Labs): We use ShadowWire's Bulletproof-based private transfer system for all payroll transactions. Employers deposit SOL into a shielded pool, then execute "internal transfers" to employee wallets. The Bulletproof range proofs ensure transaction amounts are hidden while proving they're valid (non-negative, within range).

2. Range API: Before any transfer, we verify both sender and recipient wallets via Range's compliance screening. This checks for:
   - Sanctioned addresses
   - High-risk wallet patterns  
   - Transaction history risk scoring
   We display compliance status visually and block transfers to non-compliant wallets.

3. Noir ZK Circuits: We implemented three Noir circuits for attestation:
   - Age verification (KYC-ready)
   - Risk threshold proof (proves risk score below threshold without revealing exact score)
   - Selective disclosure (proves compliance criteria met without revealing underlying data)

ARCHITECTURE:
- Next.js 16 frontend with Solana wallet adapter
- ShadowWire SDK for private transfers
- Range API integration for compliance screening
- Noir/bb.js for ZK proof generation

KEY DIFFERENTIATOR:
Other private payroll solutions focus only on hiding balances. ShadowPay is the only solution that combines privacy with provable compliance - essential for enterprise adoption. We hide salaries AND prove you're not paying sanctioned entities.
```

---

## 🗺️ ROADMAP (Copy this entire block)

```
IMMEDIATE (Post-hackathon):
- Multi-token support (USDC, other stablecoins)
- Production deployment with real Range API keys
- Improved error handling and transaction monitoring

SHORT-TERM (1-3 months):
- Recurring payroll scheduling
- Employee self-service dashboard
- Batch payroll optimization for gas savings
- Mobile-responsive UI improvements

MEDIUM-TERM (3-6 months):
- Compliance attestation export for auditors
- Integration with accounting software (QuickBooks, Xero)
- Multi-sig employer wallets
- Fiat on/off ramp integration

LONG-TERM VISION:
Position ShadowPay as the standard for privacy-preserving payroll on Solana, with enterprise compliance features that make private payments acceptable to regulators.
```

---

## 🎬 VIDEO REQUIREMENTS

- **Max Length**: 4 minutes
- **Content**: Project presentation + live demo
- **Upload to**: YouTube (unlisted) or Loom

### Video Script Outline (4 mins)

| Time | Section | Content |
|------|---------|---------|
| 0:00-0:30 | Hook & Problem | Payroll exposes sensitive data on-chain |
| 0:30-1:30 | Demo - Employer | Shield funds → Upload CSV → Run payroll |
| 1:30-2:00 | Demo - Employee | View balance → Stealth withdraw with scheduling |
| 2:00-2:45 | Technical | ShadowWire Bulletproofs + Range compliance |
| 2:45-3:30 | Why It Matters | DAOs, enterprises, GDPR compliance |
| 3:30-4:00 | Roadmap & CTA | Multi-token, recurring payments, try it now |

### Key Demo Points to Show

**Employer Flow:**
1. Click "Try Demo Mode" on landing page
2. Select "Employer"
3. Enter amount → Click "Shield" (show terminal logs)
4. Click "Load Sample" for employees
5. Click "Parse Employees" (show Range compliance checks)
6. Click "Run Private Payroll" (show each transfer with hidden amounts)

**Employee Flow:**
1. Go back → Select "Employee"
2. Show hidden balance with reveal toggle
3. Enable "Private Mode" for stealth withdrawal
4. Enter amount → Show split preview with different scheduled times
5. Click "Schedule" (show Poisson-distributed timing in logs)
6. Show scheduled withdrawals with different delivery times

---

## ✅ FINAL CHECKLIST

Before submitting, verify:

- [ ] GitHub repo is PUBLIC
- [ ] README has clear instructions
- [ ] Demo mode works without wallet
- [ ] Vercel deployment is accessible (disable SSO protection!)
- [ ] Video uploaded and link copied
- [ ] All form fields filled

---

## 🏆 BOUNTY ALIGNMENT

| Sponsor | Bounty | How We Use It |
|---------|--------|---------------|
| **Radr (ShadowWire)** | $15,000 | All private transfers use ShadowWire Bulletproof proofs |
| **Range** | $1,500 | Pre-payment wallet compliance screening |

**Total potential**: $16,500

**Why we win both:**
- ShadowWire: Complete integration for deposit/transfer/withdraw
- Range: Sender + recipient compliance checks before every transfer

---

## 💬 TALKING POINTS

**One-liner:**
"Bagel hides your payroll. ShadowPay hides your payroll AND proves you're not paying criminals."

**Elevator pitch:**
"Every month, millions of salary payments expose sensitive financial data on-chain. ShadowPay uses ShadowWire's Bulletproof proofs to hide amounts and Range's compliance API to prove every recipient is clean. Privacy that regulators can trust."

**Technical hook:**
"We're the only private payroll solution with built-in compliance. Others just hide balances - we hide balances AND generate ZK attestations proving regulatory requirements are met."
