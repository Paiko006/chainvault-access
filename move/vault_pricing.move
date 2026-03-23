module 0x58022a868425261d7667a731d7986708f36c56782d49e15ad21c568778a48ef2::vault_pricing {
    use std::signer;
    use std::string::{String};
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;

    struct UserUpgrade has key {
        capacity_bytes: u64,
        upgrade_timestamp: u64,
    }

    #[event]
    struct UpgradeEvent has drop, store {
        user: address,
        capacity_bytes: u64,
        timestamp: u64,
    }

    /// Public function to buy capacity.
    /// In a real implementation, this would also handle ShelbyUSD token transfers.
    public entry fun buy_capacity(user: &signer, capacity_bytes: u64) acquires UserUpgrade {
        let user_addr = signer::address_of(user);
        let now = timestamp::now_microseconds();

        if (!exists<UserUpgrade>(user_addr)) {
            move_to(user, UserUpgrade {
                capacity_bytes,
                upgrade_timestamp: now,
            });
        } else {
            let upgrade = borrow_global_mut<UserUpgrade>(user_addr);
            upgrade.capacity_bytes = capacity_bytes;
            upgrade.upgrade_timestamp = now;
        };

        event::emit(UpgradeEvent {
            user: user_addr,
            capacity_bytes,
            timestamp: now,
        });
    }

    #[view]
    public fun get_capacity(user_addr: address): u64 acquires UserUpgrade {
        if (!exists<UserUpgrade>(user_addr)) {
            return 5368709120 // Default 5GB
        };
        borrow_global<UserUpgrade>(user_addr).capacity_bytes
    }
}
