module 0x58022a868425261d7667a731d7986708f36c56782d49e15ad21c568778a48ef2::shelby_usd {
    use std::string;
    use aptos_framework::coin::{Self, BurnCapability, FreezeCapability, MintCapability};

    struct SUSD {}

    struct Capabilities has key {
        burn_cap: BurnCapability<SUSD>,
        freeze_cap: FreezeCapability<SUSD>,
        mint_cap: MintCapability<SUSD>,
    }

    public entry fun initialize(admin: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<SUSD>(
            admin,
            string::utf8(b"Shelby USD"),
            string::utf8(b"SUSD"),
            8,
            true,
        );
        move_to(admin, Capabilities {
            burn_cap,
            freeze_cap,
            mint_cap,
        });
    }

    public entry fun mint(admin: &signer, dst_addr: address, amount: u64) acquires Capabilities {
        let caps = borrow_global<Capabilities>(signer::address_of(admin));
        let coins_minted = coin::mint<SUSD>(amount, &caps.mint_cap);
        coin::deposit(dst_addr, coins_minted);
    }
}
