# ShadowPay Demo Video Script (4 minutes)

## INTRO (30 seconds)
**[Screen: ShadowPay landing page]**

"Hi, I'm [Name]. This is ShadowPay - private payroll infrastructure for Solana.

The problem: When companies pay employees on-chain, everyone can see exactly who got paid and how much. That's a privacy nightmare.

ShadowPay fixes this using Bulletproof range proofs via ShadowWire, combined with Range API for compliance."

---

## TECH STACK (30 seconds)
**[Screen: Show README or architecture slide]**

"Here's our tech stack:
- **ShadowWire SDK** - Bulletproof range proofs to hide payment amounts
- **Range API** - Real-time wallet compliance screening (no sanctioned wallets)
- **Solana** - Fast, cheap transactions
- **Next.js** - Modern web interface

The key innovation: Employees know their salary. Employers know who they paid. But nobody else can see the amounts on-chain."

---

## EMPLOYER DEMO (1.5 minutes)
**[Screen: Click 'Employer' mode, enable Demo Mode]**

"Let me show the employer flow.

**Step 1: Shield Funds**
The employer deposits SOL into a private pool. [Type 50, click Shield]
Watch the terminal - we're generating Bulletproof range proofs. The funds are now hidden from chain explorers.

**Step 2: Load Employees**
Upload a CSV with employee wallets and amounts. [Click 'Load Sample']
Notice the Range API checking each wallet for compliance - no sanctioned addresses allowed.

**Step 3: Run Payroll**
[Click 'Execute Private Payroll']
Each employee receives their exact salary, but the amounts are hidden via Bulletproofs.
Observers see transfers happened, but cannot determine who got what.

Total privacy. Full compliance."

---

## EMPLOYEE DEMO (1 minute)
**[Screen: Click 'Employee' mode]**

"Now the employee perspective.

Employees can see their shielded balance - their salary is private but accessible to them.

**Simple Withdraw**: Instant unshield to public wallet.

**Stealth Withdraw**: This is the advanced mode - splits the amount into fragments, routes through fresh addresses with Poisson-distributed timing. Defeats temporal and value correlation attacks.

[Click Stealth Withdraw, show the scheduled fragments]

Each fragment goes to a derived address, returns over 24+ hours with randomized timing. Maximum unlinkability."

---

## BOUNTY ALIGNMENT (30 seconds)
**[Screen: Show README bounties section or slide]**

"We're targeting two bounties:
1. **Radr ShadowWire ($15k)** - We use their SDK for all Bulletproof operations
2. **Range API ($1.5k)** - Integrated for wallet compliance screening

ShadowPay demonstrates both technologies in a real-world use case: compliant private payroll."

---

## OUTRO (15 seconds)
**[Screen: Landing page with GitHub link visible]**

"ShadowPay - because your salary is nobody's business but yours.

Check out the code on GitHub. Thanks for watching!"

---

# RECORDING TIPS

1. **Demo Mode ON** - Toggle it at top-right corner
2. **Keep terminal visible** - Shows the ZK proof generation
3. **Talk while clicking** - Don't wait for animations silently
4. **4 min max** - Practice once to hit timing
5. **Screen + Audio only** - Facecam optional

# SLIDES (if needed)

Slide 1: Title - "ShadowPay: Private Payroll for Solana"
Slide 2: Problem - "On-chain payments expose salaries to everyone"
Slide 3: Solution - "Bulletproof range proofs + Compliance API"
Slide 4: Tech Stack - ShadowWire, Range API, Solana, Next.js
Slide 5: Demo (switch to app)
Slide 6: Bounties - Radr $15k, Range $1.5k

# DEMO URLs

- Local: http://localhost:3000
- Vercel: [your-vercel-url]
- GitHub: https://github.com/Arpit-Khandelwal/shadowpay-demo
