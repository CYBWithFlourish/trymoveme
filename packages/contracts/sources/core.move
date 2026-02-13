module trymoveme::core {
    use std::string::String;
    use sui::kiosk::{Kiosk, KioskOwnerCap};
    use sui::object::{Self, UID};
    use sui::package;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use trymoveme::kiosk;

    friend trymoveme::kiosk;

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

    // The Victory Token (SBT) pointing to Walrus evidence (stored under kiosk)
    struct ProofOfHack has key, store {
        id: UID,
        room_id: String,
        walrus_blob_id: String, // <--- The SEAL
        winner: address,
        timestamp: u64
    }

    // Lightweight receipt SBT minted directly to the winner's wallet for visibility
    struct ProofReceipt has key, store {
        id: UID,
        room_id: String,
        walrus_blob_id: String,
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
    public fun mint_cadet_pass(ctx: &mut TxContext) {
        let pass = CadetPass {
            id: object::new(ctx),
            issue_date: tx_context::epoch(ctx)
        };
        transfer::public_transfer(pass, tx_context::sender(ctx));
    }

    // Provision a kiosk for a user (admin-only via OracleCap)
    public fun provision_kiosk(
        _: &OracleCap,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let (k, cap) = kiosk::mint_for(recipient, ctx);
        transfer::transfer(k, recipient);
        transfer::transfer(cap, recipient);
    }

    // Called by Backend ONLY (guarded by OracleCap)
    public fun seal_victory(
        _: &OracleCap,
        user_kiosk: &mut Kiosk,
        user_kiosk_cap: &KioskOwnerCap,
        winner: address,
        room_id: String,
        walrus_blob_id: String,
        ctx: &mut TxContext
    ) {
        let timestamp = tx_context::epoch(ctx);

        let proof = ProofOfHack {
            id: object::new(ctx),
            room_id: room_id.clone(),
            walrus_blob_id: walrus_blob_id.clone(),
            winner,
            timestamp,
        };

        // Place+lock in kiosk (SBT-style)
        kiosk::place_and_lock_proof(user_kiosk, user_kiosk_cap, proof);

        // Mint a wallet-level receipt SBT for easy inventory visibility
        let receipt = ProofReceipt {
            id: object::new(ctx),
            room_id,
            walrus_blob_id,
            timestamp,
        };
        transfer::transfer(receipt, winner);
    }

    // Helper for receipts
    public fun receipt_info(receipt: &ProofReceipt): (&String, &String, u64) {
        (&receipt.room_id, &receipt.walrus_blob_id, receipt.timestamp)
    }
}