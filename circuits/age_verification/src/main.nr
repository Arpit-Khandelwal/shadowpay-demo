// Age Verification Circuit
// Proves that a user is at least a minimum age without revealing their actual age
// This enables compliant age-gating for DeFi without data exposure

fn main(
    // Private inputs (not revealed in proof)
    age: u8,
    // Public inputs (can be verified by anyone)
    minimum_age: pub u8
) {
    // Assert that the user's age is greater than or equal to minimum age
    assert(age >= minimum_age, "Age verification failed: user is below minimum age");
}

// Test cases
#[test]
fn test_adult_passes() {
    main(25, 18);
}

#[test]
fn test_exactly_18_passes() {
    main(18, 18);
}

#[test(should_fail)]
fn test_minor_fails() {
    main(16, 18);
}

#[test]
fn test_custom_minimum() {
    main(21, 21); // For US alcohol age
}
