// Selective Disclosure Circuit
// Combines multiple private attributes into a single proof for institutional compliance
// Proves: age >= minimum AND risk_score <= max AND is_sanctioned == false
// Without revealing any actual values

fn main(
    // Private inputs (not revealed in proof)
    age: u8,
    risk_score: u8,
    is_sanctioned: bool,
    wallet_balance_usd: u32,  // For minimum balance requirements
    
    // Public inputs (verifiable parameters)
    minimum_age: pub u8,
    max_risk_score: pub u8,
    min_balance_usd: pub u32
) {
    // Age verification
    assert(age >= minimum_age, "Age requirement not met");
    
    // Risk score verification
    assert(risk_score >= 1, "Invalid risk score");
    assert(risk_score <= 10, "Invalid risk score");
    assert(risk_score <= max_risk_score, "Risk threshold exceeded");
    
    // Sanctions check - must NOT be sanctioned
    assert(!is_sanctioned, "Address is sanctioned");
    
    // Balance verification (optional institutional requirement)
    assert(wallet_balance_usd >= min_balance_usd, "Minimum balance requirement not met");
}

// Test cases
#[test]
fn test_compliant_user_passes() {
    main(
        25,     // age
        3,      // risk_score (low)
        false,  // not sanctioned
        10000,  // $10,000 balance
        18,     // min age
        5,      // max risk
        1000    // min balance
    );
}

#[test(should_fail)]
fn test_sanctioned_user_fails() {
    main(
        25,
        2,
        true,   // SANCTIONED
        50000,
        18,
        5,
        1000
    );
}

#[test(should_fail)]
fn test_high_risk_user_fails() {
    main(
        30,
        8,      // HIGH RISK
        false,
        100000,
        18,
        5,
        1000
    );
}

#[test(should_fail)]
fn test_underage_fails() {
    main(
        16,     // UNDERAGE
        1,
        false,
        50000,
        18,
        5,
        1000
    );
}

#[test]
fn test_institutional_requirements() {
    // Higher requirements for institutional access
    main(
        35,
        2,
        false,
        100000,
        21,     // 21+ age requirement
        3,      // stricter risk threshold
        50000   // higher min balance
    );
}
