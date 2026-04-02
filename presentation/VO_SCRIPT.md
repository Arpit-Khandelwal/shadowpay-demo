# 🎙️ SHADOWPAY: THE MASTER SCRIPT
**Tone**: High-energy, serious, "Cyberpunk Fintech".
**Total Duration**: ~4:00
**Setup**: Open your Slides in Tab 1. Open ShadowPay Demo (`https://privacy-compliance-tool.vercel.app/`) in Tab 2.

---

### [SLIDE 1: TITLE]
**(0:00 - 0:20)**
**VO**: "Payroll is broken.  Employees can see each other's salaries. Competitors can track your burn rate. This isn't just inconvenient - it's a privacy violation.

I'm Ojaswi and we're building **ShadowPay** to solve this.
The first compliant, private payroll infrastructure for Solana.
Zero logging. Zero leaks. 100% compliant."

---

### [SLIDE 2: THE PROBLEM]
**(0:20 - 0:50)**
**VO**: "On-chain payroll today is a privacy disaster. And it’s hurting everyone.
**For Employers:** Your burn rate is public. Competitors know exactly what you pay your talent. You are naked in a room full of sharks.
**For Employees:** Your colleagues know your salary. Hackers know your holdings. It’s a physical safety risk.
**For DAOs:** You want treasury transparency, but doxxing your contributors' wallets isn't 'community building'—it's dangerous."

---

### [SLIDE 3: THE SOLUTION]
**(0:50 - 1:05)**
**VO**: "ShadowPay fixes this.
On the left: The old way. Naked. Exposed.
On the right: The ShadowPay way.
We use **ShadowWire Bulletproofs** to mathematically prove a payment is valid—without ever revealing the amount.
The blockchain sees a transfer. The world sees... absolutely nothing."

---

### [SLIDE 4: HOW IT WORKS]
**(1:05 - 1:20)**
**VO**: "The architecture is simple but powerful.
**Step 1:** The employer shields funds into our private pool.
**Step 2:** We hit the **Range API**. Every single wallet is screened for sanctions in real-time. If it’s on a watchlist, the money doesn’t move.
**Step 3:** The employee gets paid. Hidden amounts. Provable compliance."

---

### [SLIDE 5: TECH STACK]
**(1:20 - 1:35)**
**VO**: "We didn't reinvent the wheel; we weaponized it using
**ShadowWire SDK** for the cryptography and **Range API** for the compliance.

And ofcourse, **Solana** for the speed.

---

### [SLIDE 6: LIVE DEMO - EMPLOYER]
**(1:35 - 1:40)**
**VO**: "Let's see it live."

**👉 [ACTION: TAB SWITCH TO DEMO APP] 👈**
**(1:40 - 2:20)**

**[ACTION: Ensure 'Employer' view is open. Toggle 'Demo Mode' ON]**

**VO**: "I'm the Employer. I have a treasury to manage."

**[ACTION: Type '10' in Shield Funds input. Click 'Shield' button]**
**VO**: "First, I shield 10 SOL into the private pool.
Watch the terminal. Those are ZK proofs generating.
Boom. Funds are now off the radar."

**[ACTION: Click 'Load Sample' CSV button]**
**VO**: "Next, I load my employee list."

**[ACTION: Mouse hover over the 'Verified Compliant' logs/badges]**
**VO**: "Pause here. This is crucial.
Before a single cent moves, **Range API** is screening every wallet.
Sanctions? Blocked. High risk? Flagged.
We provide privacy, NOT a washing machine for criminals."

**[ACTION: Click 'Run Private Payroll'. Watch progress bar]**
**VO**: "I hit Run.
ShadowPay executes transfers using Bulletproofs.
Alice gets paid. Bob gets paid.
To an observer? It looks like random encrypted noise."

---

### [SLIDE 7: LIVE DEMO - EMPLOYEE]
**(2:20 - 2:25)**

**👉 [ACTION: TAB SWITCH TO SLIDES] 👈**
**[VISUAL: Show Slide 7 briefly]**
**VO**: "Now, let's look at the Employee view."

**👉 [ACTION: TAB SWITCH TO DEMO APP] 👈**
**(2:25 - 3:00)**

**[ACTION: Click 'Back'. Click 'Employee' Dashboard]**

**VO**: "I log in as an employee. I see my shielded balance. Only I have the key." **[ACTION: Point mouse to 'Shielded Balance']**


**VO**: "We've two transfer mechanisms. Simple, and Private. I can do a **Simple Withdraw** to my public wallet."

**[ACTION: Click 'Stealth Withdraw'. Watch the visualization]**
**VO**: "But for true privacy, I use **Stealth Withdraw**.
This doesn't just send money. It fragments it."

**[ACTION: Mouse follows the fragment logs in terminal]**
**VO**: "Look at the logs.
One chunk now. One chunk in 24 hours. Another in 41 hours.
Routed through fresh, one-time addresses.
We defeat temporal correlation. We defeat value correlation."

---

### [SLIDE 8: STEALTH WITHDRAW]
**(3:00 - 3:20)**

**👉 [ACTION: TAB SWITCH TO SLIDES] 👈**

**VO**: "Here is what just happened under the hood.
We used a Poisson distribution to randomize those time delays.
Even if someone is watching your wallet 24/7, it is mathematically impossible to link these funds back to the payroll source.
This is the future of financial privacy."

---

### [SLIDE 9: BOUNTIES]
**(3:20 - 3:40)**
**VO**: "We are targeting two major bounties.
**Radr ShadowWire**: For our deep integration of their privacy SDK.
**Range Protocol**: For making privacy compliant with automated risk screening.
ShadowPay proves you don't have to choose between privacy and compliance. You can have both."

---

### [SLIDE 10: CLOSING]
**(3:40 - 4:00)**
**VO**: "DAOs shield your treasury.
Employers protect your burn rate.
Employees reclaim your safety.
**ShadowPay**. Your salary is nobody's business but yours.
Live on Solana devnet. Thank you."
