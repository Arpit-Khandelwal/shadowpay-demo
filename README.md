# ShadowPay 🔒

**Compliant Private Payroll for Solana**

Hide salaries on-chain while proving regulatory compliance via ZK proofs.

Built for the [Solana Privacy Hackathon 2026](https://solana.com/privacyhack).

**🎬 [Try the Live Demo](https://privacy-compliance-tool-arpitkhandelwals-projects.vercel.app)** — Works without wallet, click "Demo Mode"

---

## 🎯 The Problem

Every month, millions of salary payments expose sensitive financial data on-chain:
- Employees can see each other's salaries
- Competitors can track your burn rate
- Salary data is permanently public

**This isn't just inconvenient — it's a privacy violation that blocks enterprise adoption of on-chain payroll.**

## 💡 The Solution

ShadowPay enables private payroll that's also **compliant**:

1. **Hidden Amounts** — Salary amounts are hidden using Bulletproof range proofs via ShadowWire
2. **Proven Compliance** — Every wallet is screened via Range API before payment
3. **ZK Attestations** — Generate proofs that compliance requirements are met without revealing sensitive data

**Competitors hide balances. We hide balances AND prove you're not paying sanctioned entities.**

> *The key insight: Privacy alone isn't enough for enterprise adoption. Compliance is the missing piece. ShadowPay delivers both.*

---

## 🏆 Bounty Alignment

| Sponsor | Bounty | Our Integration |
|---------|--------|-----------------|
| **Radr (ShadowWire)** | $15,000 | Private transfers via Bulletproof ZK proofs |
| **Range** | $1,500 | Pre-screening wallet compliance for sender & recipients |

### Why Solana?

- **Speed**: Sub-second finality means payroll executes instantly, not in 15-minute blocks
- **Cost**: $0.00025/tx means paying 100 employees costs pennies, not dollars
- **ShadowWire**: Radr's Bulletproof implementation is Solana-native with optimized on-chain verification
- **Ecosystem**: Solana wallet adapter provides seamless UX for both employers and employees

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Mode

Click **"Try Demo Mode"** on the landing page to see the full flow without connecting a wallet. Demo mode simulates:
- Wallet balances (public + shielded)
- Compliance checks via Range API
- Private transfers via ShadowWire
- Bulletproof range proof generation
- **Employee withdrawals** (simple + stealth mode with mixing)

**🎬 [Live Demo](https://privacy-compliance-tool-arpitkhandelwals-projects.vercel.app)** ← Try it now!

---

## 🏗️ How It Works

### For Employers

1. **Connect Wallet** → Instant compliance verification via Range
2. **Shield Funds** → Deposit SOL into ShadowWire's private pool
3. **Upload Employees** → CSV with wallet addresses, each screened for compliance
4. **Run Payroll** → Private transfers to all employees, amounts hidden

### For Employees

1. **Connect Wallet** → See your shielded balance (only visible to you)
2. **Simple Withdraw** → Unshield funds to your public wallet instantly
3. **Stealth Withdraw** → Split funds through mixing addresses for enhanced privacy
4. **Privacy Score** → See real-time privacy metrics for your withdrawal strategy

---

## 🔧 Tech Stack

| Technology | Purpose |
|------------|---------|
| **ShadowWire** | Private transfers using Bulletproof range proofs |
| **Range API** | Wallet compliance screening (sanctions, risk scoring) |
| **Next.js 16** | React framework with Turbopack |
| **Solana Wallet Adapter** | Wallet connection |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main UI (Employer/Employee dashboards)
│   ├── components/
│   │   ├── AppWalletProvider.tsx   # Solana wallet context
│   │   ├── ComplianceBadge.tsx     # Range compliance indicator
│   │   ├── TerminalLog.tsx         # Activity log display
│   │   └── ...
│   └── api/
│       ├── compliance/check/       # Range compliance endpoint
│       ├── attestation/generate/   # ZK attestation generation
│       ├── transfer/private/       # ShadowWire transfer
│       └── proof/verify/           # Proof verification
└── lib/
    ├── compliance-service.ts       # Orchestrates Range + ShadowWire + Noir
    ├── shadowwire-service.ts       # ShadowWire SDK wrapper
    ├── range-client.ts             # Range API client
    ├── noir-proof-service.ts       # Noir proof generation
    └── privacy-utils.ts            # Key derivation, amount splitting
```

---

## 🔐 Privacy Features

| Feature | Implementation |
|---------|---------------|
| **Hidden Amounts** | ShadowWire Bulletproof range proofs |
| **Compliance Screening** | Range API for sender + all recipients |
| **Amount Splitting** | Optional withdrawal splitting to defeat correlation |
| **Fresh Addresses** | Deterministic address derivation for each split |

---

## 🛣️ Roadmap

**Post-Hackathon:**
- Multi-token support (USDC payroll)
- Recurring scheduled payments
- Employee self-service portal
- **Noir ZK attestations** - Enable employees to prove income to third parties (lenders, landlords) without revealing salary details

**Long-term:**
- Fiat on/off ramp integration
- Accounting software integration (QuickBooks, Xero)
- Multi-sig employer wallets

---

## 🔑 Environment Variables

```env
RANGE_API_KEY=your_range_api_key
HELIUS_API_KEY=your_helius_api_key
MAX_RISK_THRESHOLD=5
USE_MOCK_RANGE=true
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
```

---

## 📜 License

MIT

---

## 🙏 Acknowledgments

- [Radr Labs](https://radr.fun) for ShadowWire
- [Range](https://range.org) for compliance APIs
- [Aztec](https://aztec.network) for Noir
- [Solana Foundation](https://solana.org) for the hackathon
