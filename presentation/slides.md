---
marp: true
theme: uncover
class: invert
paginate: false
backgroundColor: #000
color: #fff
style: |
  section {
    font-family: 'Inter', system-ui, sans-serif;
  }
  h1 {
    color: #10b981;
    font-size: 3.5em;
    text-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
  }
  h2 {
    color: #10b981;
    font-size: 2em;
  }
  h3 {
    color: #06b6d4;
  }
  code {
    background: #1a1a1a;
    color: #10b981;
  }
  .emerald { color: #10b981; }
  .cyan { color: #06b6d4; }
  .red { color: #ef4444; }
  .gray { color: #71717a; }
---

<!-- _class: lead -->

# 🛡️ SHADOWPAY

**Private Payroll Infrastructure for Solana**

<span class="gray">Solana Privacy Hackathon 2026</span>

---

## ⚠️ THE PROBLEM

### Your Salary is Public

```
TX: 7xKf4... → Alice.sol    5.25 SOL  ← EVERYONE SEES
TX: 3mNz... → Bob.sol       8.00 SOL  ← COMPETITORS KNOW  
TX: 9pQr... → Carol.sol     3.75 SOL  ← POACHING RISK
```

<span class="red">On Solana, every payment is an open book.</span>

---

## ✓ THE SOLUTION

### Bulletproof Privacy

| BEFORE | AFTER (ShadowPay) |
|--------|-------------------|
| Alice: 5.25 SOL | Alice: ████ SOL |
| Bob: 8.00 SOL | Bob: ████ SOL |
| Carol: 3.75 SOL | Carol: ████ SOL |

<span class="emerald">Transfers visible. Amounts hidden. Mathematically proven.</span>

---

## How It Works

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  EMPLOYER   │───▶│  SHADOWWIRE  │───▶│  EMPLOYEES  │
│  Deposits   │    │  Pool        │    │  Receive    │
│  50 SOL     │    │  ████████    │    │  ██ SOL     │
└─────────────┘    └──────────────┘    └─────────────┘
                          │
                   ┌──────┴──────┐
                   │  RANGE API  │
                   │  Compliance │
                   └─────────────┘
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| 🛡️ **ShadowWire SDK** | Bulletproof range proofs |
| 🔍 **Range API** | OFAC/sanctions screening |
| ⚡ **Solana** | 400ms finality, $0.00025/tx |
| 🔐 **Zero-Knowledge** | Privacy via cryptography |

---

<!-- _class: lead -->

# 🖥️ LIVE DEMO

## Employer Flow

**Shield → Load CSV → Run Payroll**

<span class="cyan">Switch to: localhost:3000</span>

---

<!-- _class: lead -->

# 🖥️ LIVE DEMO

## Employee Flow

**View Balance → Withdraw (Simple or Stealth)**

<span class="cyan">Switch to: localhost:3000</span>

---

## Stealth Withdraw

### Poisson-Distributed Fragmentation

```
10 SOL → Split into untraceable fragments

+24h     +28h     +35h     +41h
 │        │        │        │
 ▼        ▼        ▼        ▼
2.1→     3.4→     1.8→     2.7→
addr₁    addr₂    addr₃    addr₄
```

🎲 Random timing defeats correlation attacks

---

## Bounty Alignment

| Bounty | Amount | Integration |
|--------|--------|-------------|
| **RADR / ShadowWire** | $15,000 | ✓ Bulletproof SDK |
| **Range Protocol** | $1,500 | ✓ Compliance API |

---

<!-- _class: lead -->

# 🛡️ SHADOWPAY

*"Your salary is nobody's business but yours."*

**github.com/Arpit-Khandelwal/shadowpay-demo**

<span class="gray">Thank you! 🙏</span>
