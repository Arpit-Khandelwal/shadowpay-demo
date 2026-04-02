# SUBMISSION FORM ANSWERS
**Link**: https://solanafoundation.typeform.com/privacyhacksub

---

## 1. Project Information

**Project Name:**
ShadowPay

**One-line Description:**
Compliant private payroll for Solana that hides salaries on-chain using ShadowWire Bulletproofs while proving regulatory compliance via Range API.

**Track:**
DeFi / Payments

**GitHub URL:**
https://github.com/Arpit-Khandelwal/shadowpay-demo

**Live Demo URL:**
[YOUR_VERCEL_URL]

**Video URL:**
[YOUR_VIDEO_URL]

---

## 2. Technical Description (Detailed)

ShadowPay is a privacy-first payroll platform built on Solana that solves the "transparent salary" problem for DAOs and enterprises. It combines military-grade privacy with automated regulatory compliance.

**Key Innovations:**

1. **Private Transfers (ShadowWire):** We utilize the ShadowWire SDK to implement a shielded pool architecture. Employers deposit funds, which are then transferred internally to employees using Bulletproof range proofs. This hides transaction amounts while mathematically proving their validity (non-negative, within range). To an outside observer, a payroll run of 50 employees looks like 50 valid transfers with zero value metadata.

2. **Automated Compliance (Range API):** Privacy tools often fail due to compliance risks. ShadowPay integrates Range API directly into the transfer flow. Before any funds move, we screen:
   - The Employer wallet (Source)
   - Every Employee wallet (Destination)
   This ensures no funds ever flow to sanctioned or high-risk addresses, making private payroll viable for regulated entities.

3. **Stealth Withdrawals:** We implemented a "Stealth Withdraw" feature for employees that splits withdrawals into multiple fragments, routes them through fresh derived addresses, and uses Poisson-distributed time delays (24-48h). This defeats both temporal and value-based correlation attacks.

**Architecture:**
- **Frontend**: Next.js 16 (App Router), Tailwind CSS
- **Blockchain**: Solana Web3.js, @solana/wallet-adapter
- **Privacy Layer**: @radr/shadowwire (WASM-based Bulletproofs)
- **Compliance**: Range Protocol API
- **ZK Proofs**: Noir circuits (roadmap integration for income attestation)

---

## 3. Bounty Questions

**Which bounties are you applying for?**
- Radr / ShadowWire ($15k)
- Range Protocol ($1.5k)

**How did you use ShadowWire?**
We integrated the ShadowWire SDK (`@radr/shadowwire`) to power our core privacy engine. The app uses `ShadowWireClient` to:
1. Create a shielded pool for the employer
2. Generate Bulletproof range proofs for every payroll transaction
3. Execute private internal transfers between shielded balances
4. Facilitate withdrawals back to public Solana wallets
Our implementation demonstrates a real-world use case (payroll) where hiding amounts is critical but transfer visibility is acceptable.

**How did you use Range?**
We integrated Range API as a mandatory gatekeeper in our transaction flow. In `privacy-utils.ts`, we implemented a `checkCompliance()` function that queries Range's risk scoring endpoint.
- **Employer Flow**: When uploading a CSV, every employee address is batched-checked against Range's sanctions list.
- **Visual Feedback**: The UI displays a "Verified Compliant" badge for safe wallets and blocks transfers to flagged ones.
This turns a standard privacy tool into a compliance-ready fintech product.

---

## 4. Roadmap

**Immediate (Post-Hackathon):**
- Add multi-token support (USDC, EURC) for stablecoin payroll
- Deploy production version with live Range API keys

**Short-term (1-3 months):**
- **Recurring Payments**: Smart contract for automated monthly private payroll
- **Employee Portal**: Self-service dashboard for tax documents and proof of income
- **Gas Optimization**: Batch transactions to reduce fees for large teams

**Long-term:**
- **ZK Attestations**: Integrate our Noir circuits to allow employees to prove income to lenders (e.g., for a mortgage) without revealing their full salary history.
- **Fiat On-Ramp**: Direct bank-to-shielded-pool deposits for seamless web2 corporate integration.

---

## 5. Contact Info

**Telegram Handle:**
[YOUR_TELEGRAM]

**Email:**
[YOUR_EMAIL]
