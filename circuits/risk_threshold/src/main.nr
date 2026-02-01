// Risk Threshold Circuit
// Proves that a wallet's risk score is below a maximum threshold without revealing the actual score
// This enables compliant transfers while preserving privacy of the exact risk assessment

fn main(
    // Private inputs (not revealed in proof)
    risk_score: u8,        // Range API returns 1-10, we use u8 for flexibility
    // Public inputs (can be verified by anyone)
    max_allowed_risk: pub u8  // e.g., 5 for medium risk tolerance
) {
    // Assert that the risk score is within acceptable range (1-10)
    assert(risk_score >= 1, "Invalid risk score: must be at least 1");
    assert(risk_score <= 10, "Invalid risk score: must be at most 10");
    
    // Assert that the risk score is below or equal to the maximum allowed
    assert(risk_score <= max_allowed_risk, "Risk threshold exceeded: wallet is too risky");
}

// Test cases
#[test]
fn test_low_risk_passes() {
    main(2, 5);  // Risk score 2 with max allowed 5
}

#[test]
fn test_exact_threshold_passes() {
    main(5, 5);  // Risk score exactly at threshold
}

#[test(should_fail)]
fn test_high_risk_fails() {
    main(8, 5);  // Risk score 8 exceeds max 5
}

#[test]
fn test_very_low_risk() {
    main(1, 3);  // Minimal risk
}

#[test(should_fail)]
fn test_critical_risk_fails() {
    main(10, 5);  // Critical risk (directly malicious)
}
