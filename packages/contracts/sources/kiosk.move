module trymoveme::kiosk {
    use sui::kiosk::{Self as SK, Kiosk, KioskOwnerCap};
    use sui::object;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use trymoveme::badge;
    use trymoveme::core;

    friend trymoveme::badge;
    friend trymoveme::core;

    // Create a kiosk and owner cap for the caller
    public entry fun create(ctx: &mut TxContext) {
        let (k, cap) = SK::new(ctx);
        transfer::public_transfer(k, tx_context::sender(ctx));
        transfer::public_transfer(cap, tx_context::sender(ctx));
    }

    // Friend-only factory for provisioning (e.g., admin-driven signup)
    public(friend) fun mint_for(_: address, ctx: &mut TxContext): (Kiosk, KioskOwnerCap) {
        SK::new(ctx)
    }

    // Friend-only helper: place and lock a proof inside a kiosk (SBT behavior)
    public(friend) fun place_and_lock_proof(
        kiosk: &mut Kiosk,
        owner_cap: &KioskOwnerCap,
        proof_obj: core::ProofOfHack,
    ) {
        let id = object::id(&proof_obj.id);
        SK::place(kiosk, owner_cap, proof_obj);
        SK::lock(kiosk, owner_cap, id);
    }

    // Friend-only helper: place and lock a badge inside a kiosk (SBT behavior)
    public(friend) fun place_and_lock_badge(
        kiosk: &mut Kiosk,
        owner_cap: &KioskOwnerCap,
        badge_obj: badge::Badge,
    ) {
        let id = object::id(&badge_obj.id);
        SK::place(kiosk, owner_cap, badge_obj);
        SK::lock(kiosk, owner_cap, id);
    }
}
