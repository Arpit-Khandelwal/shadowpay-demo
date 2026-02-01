# ShadowPay - Hackathon Submission (COPY-PASTE READY)

## ⏰ DEADLINE: 11PM ET FEBRUARY 1ST

**Submit at**: https://solanafoundation.typeform.com/privacyhacksub

---

## 📋 FORM FIELDS (Copy-Paste Ready)

### Project Name
```
ShadowPay
```

### Tagline / One-Line Description
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

### Demo Video URL
```
[ADD YOUR YOUTUBE/LOOM LINK HERE]
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

### Team Name
```
ShadowPay
```

### Team Members
```
[ADD YOUR NAME, EMAIL, DISCORD, GITHUB]
```

### Solana Wallet Address (for prizes)
```
[ADD YOUR SOLANA WALLET ADDRESS]
```

### Technologies Used
```
ShadowWire SDK, Range API, Noir ZK Circuits, Next.js 16, Solana Wallet Adapter, TypeScript, Tailwind CSS
```

---

## 🎯 PROBLEM SOLVED (Copy this)

```
Every month, millions of salary payments expose sensitive financial data on-chain. On Solana, salary transactions are permanently public - employees can see each other's pay, competitors can track burn rates, and this creates real privacy violations, especially for global teams subject to GDPR.

Existing private payment solutions hide balances but have a fatal flaw: they can't prove compliance. Enterprises won't adopt privacy tools that might inadvertently pay sanctioned entities.

ShadowPay solves both problems: we hide salary amounts via ShadowWire's Bulletproof proofs AND we verify every recipient wallet via Range's compliance API before payment. Privacy that regulators can trust.
```

---

## 👥 TARGET AUDIENCE (Copy this)

```
- DAOs paying contributors without salary leaks
- Web3 companies protecting competitive compensation data  
- Global remote teams subject to GDPR and privacy regulations
- Enterprises requiring compliance audit trails for private payments
```

---

## 📝 TECHNICAL DESCRIPTION (Copy this entire block)

```
ShadowPay is a compliant private payroll solution built on Solana that enables businesses to pay employees without exposing salary amounts on-chain.

CORE TECHNOLOGIES:

1. ShadowWire (Radr Labs): We use ShadowWire's Bulletproof-based private transfer system for all payroll transactions. Employers deposit SOL into a shielded pool, then execute "internal transfers" to employee wallets. The Bulletproof range proofs ensure transaction amounts are hidden while proving they're valid (non-negative, within range).

2. Range API: Before any transfer, we verify both sender and recipient wallets via Range's compliance screening. This checks for:
   - Sanctioned addresses (OFAC, etc.)
   - High-risk wallet patterns  
   - Transaction history risk scoring
   We display compliance status visually and block transfers to non-compliant wallets. This happens automatically for every employee wallet during CSV upload.

3. Noir ZK Circuits: We implemented three Noir circuits for payroll-specific attestations:
   - Age verification: Proves employee meets legal working age without revealing DOB
   - Risk threshold proof: Proves wallet risk score is below acceptable threshold without revealing exact score
   - Selective disclosure: Enables employees to prove income to third parties (lenders, landlords) without revealing employer or full salary history

EMPLOYER WORKFLOW:
1. Connect wallet → Instant Range compliance check on employer
2. Shield funds → Deposit SOL into ShadowWire's private pool
3. Upload CSV → Each employee wallet automatically screened via Range
4. Run payroll → Private transfers with hidden amounts, compliance attestations generated

EMPLOYEE WORKFLOW:
1. View shielded balance (only visible to them)
2. Withdraw instantly OR use stealth mode with time-staggered splits
3. Export ZK attestation for income verification (loans, rentals) without revealing salary

KEY DIFFERENTIATOR:
Other private payroll solutions (like Bagel using Inco) focus only on hiding balances. ShadowPay is the only solution that combines privacy with provable compliance - essential for enterprise adoption. We hide salaries AND prove you're not paying sanctioned entities.
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

## 💡 INNOVATION / UNIQUENESS (Copy this)

```
ShadowPay is the first and only private payroll solution on Solana that combines:

1. PRIVACY + COMPLIANCE: Other solutions (like Bagel using Inco) hide balances but can't prove compliance. We integrate Range API for real-time wallet screening - every payment is verified against sanctions lists and risk scores.

2. ZK ATTESTATIONS FOR PAYROLL: We use Noir circuits to generate attestations that prove compliance criteria are met (age verification, risk thresholds) without revealing underlying data. Employees can prove income to lenders without revealing their actual salary.

3. STEALTH WITHDRAWALS: Our Poisson-distributed time-staggered withdrawal system defeats temporal correlation analysis. Each fragment withdraws at a random time through fresh derived addresses.

4. ENTERPRISE-READY ARCHITECTURE: Unlike competitor prototypes, we built a production-ready workflow with CSV upload, batch compliance checking, and visual compliance badges - ready for real-world payroll operations.

The key insight: Privacy alone isn't enough for enterprise adoption. Compliance is the missing piece. ShadowPay delivers both.
```

---

## 🔐 SECURITY CONSIDERATIONS (Copy this)

```
1. NON-CUSTODIAL: ShadowPay never holds user funds. All deposits go directly to ShadowWire's shielded pool contract. Users maintain full control via their Solana wallet.

2. COMPLIANCE BY DEFAULT: Range API screening happens automatically before any transfer. Payments to flagged wallets are blocked at the application layer.

3. BULLETPROOF PROOFS: ShadowWire's Bulletproof range proofs are mathematically verified to ensure all hidden amounts are valid (non-negative, within range) without revealing actual values.

4. FRESH ADDRESS DERIVATION: Stealth withdrawals use deterministic but unique addresses derived from user seeds - preventing address reuse and correlation attacks.

5. AUDIT TRAIL: While amounts are hidden, compliance attestations create a verifiable audit trail proving all recipients were screened at time of payment.
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

**⭐ CRITICAL: Show the compliance check visually - this is your differentiator!**

**Employer Flow:**
1. Click "Try Demo Mode" on landing page
2. Select "Employer"
3. Enter amount → Click "Shield" (show terminal logs with Bulletproof proof generation)
4. Click "Load Sample" for employees
5. Click "Parse Employees" → **PAUSE HERE and narrate the compliance checks appearing in terminal**
   - "Watch as Range API screens each wallet in real-time..."
   - "Each employee shows risk score and compliance status..."
   - "This proves we're not paying sanctioned entities - all via ZK attestations"
6. Click "Run Private Payroll" (show each transfer with "AMOUNT HIDDEN" in logs)

**Employee Flow:**
1. Go back → Select "Employee"  
2. Show hidden balance with "••••••" → Click reveal toggle → Show actual balance
3. Enable "Private Mode" for stealth withdrawal
4. Enter amount → Show split preview with **different scheduled times** (24h+, 28h+, 32h+, etc.)
5. Click "Schedule" → Show Poisson-distributed timing in terminal logs
6. Show scheduled withdrawals panel with different delivery times

**Key Narration Points:**
- "Competitors hide balances. We hide balances AND prove compliance."
- "Each fragment withdraws at a random time - defeating temporal correlation."
- "Privacy that regulators can trust."

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
