module trymoveme::core {
    use std::string::String;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::package;

    // --- OBJECTS ---

    // One-time Witness for Publisher
    struct CORE has drop {}

    // The Admin Capability (held by backend) to mint proofs
    struct OracleCap has key, store { id: UID }

    // Access Badge (The "Key" to enter rooms)
    struct CadetPass has key, store {
        id: UID,
        issue_date: u64
    }

    // The Victory Token (SBT) pointing to Walrus evidence
    struct ProofOfHack has key {
        id: UID,
        room_id: String,
        walrus_blob_id: String, // <--- The SEAL
        winner: address,
        timestamp: u64
    }

    // --- FUNCTIONS ---

    fun init(otw: CORE, ctx: &mut TxContext) {
        // Create Publisher
        package::claim_and_keep(otw, ctx);

        // Give deployer (Backend) the OracleCap
        transfer::transfer(OracleCap { id: object::new(ctx) }, tx_context::sender(ctx));
    }

    // Free mint for MVP (User calls this)
    public entry fun mint_cadet_pass(ctx: &mut TxContext) {
        let pass = CadetPass {
            id: object::new(ctx),
            issue_date: tx_context::epoch(ctx)
        };
        transfer::public_transfer(pass, tx_context::sender(ctx));
    }

    // Called by Backend ONLY (guarded by OracleCap)
    public entry fun seal_victory(
        _: &OracleCap,
        winner: address,
        room_id: String,
        walrus_blob_id: String,
        ctx: &mut TxContext
    ) {
        let proof = ProofOfHack {
            id: object::new(ctx),
            room_id,
            walrus_blob_id,
            winner,
            timestamp: tx_context::epoch(ctx)
        };
        // Transfer to winner
        transfer::transfer(proof, winner);
    }
}