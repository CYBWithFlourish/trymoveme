module trymoveme::room1_hot_potato {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    /// A non-drop "hot potato" object. Lacks the drop ability, so it must be returned or transferred, not destroyed.
    struct HotPotato has key {
        id: UID,
        heat: u64,
    }

    /// Spawn a hot potato for the caller. Challenge: find a legal way to relinquish it (e.g., transfer back).
    public entry fun start(ctx: &mut TxContext) {
        let potato = HotPotato { id: object::new(ctx), heat: 1 };
        transfer::public_transfer(potato, tx_context::sender(ctx));
    }

    /// Safe cooldown path: return the potato to the module publisher (acts as "kitchen sink").
    public entry fun cooldown(potato: HotPotato, ctx: &mut TxContext) {
        // reclaim and hold; in a real lab this would check rules or burn via a privileged cap
        let _ = potato;
        // no-op: by taking ownership without drop ability, we rely on end-of-tx move semantics
    }
}
