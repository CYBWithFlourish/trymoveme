module trymoveme::badge {
    use std::string::String;
    use sui::kiosk::{Kiosk, KioskOwnerCap};
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use trymoveme::kiosk;

    // Badge object intentionally has no transfer API; it is placed+locked inside a kiosk (SBT-style)
    public struct Badge has key, store {
        id: UID,
        name: String,
        description: String,
        badge_type: String,
        image_url: String,
        issued_to: address,
        issued_at: u64,
    }

    // Mint a badge and immediately place+lock it under the recipient's kiosk (non-transferable)
    public fun mint_to_kiosk(
        kiosk_obj: &mut Kiosk,
        owner_cap: &KioskOwnerCap,
        recipient: address,
        name: String,
        description: String,
        badge_type: String,
        image_url: String,
        ctx: &mut TxContext,
    ) {
        let badge = Badge {
            id: object::new(ctx),
            name,
            description,
            badge_type,
            image_url,
            issued_to: recipient,
            issued_at: tx_context::epoch(ctx),
        };
        kiosk::place_and_lock_badge(kiosk_obj, owner_cap, badge);
    }

    // Convenience: mint to caller's kiosk
    public fun mint_for_sender_to_kiosk(
        kiosk_obj: &mut Kiosk,
        owner_cap: &KioskOwnerCap,
        name: String,
        description: String,
        badge_type: String,
        image_url: String,
        ctx: &mut TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        mint_to_kiosk(kiosk_obj, owner_cap, sender, name, description, badge_type, image_url, ctx);
    }

    // Read helpers
    public fun id_str(badge: &Badge): String {
        object::uid_to_string(&badge.id)
    }

    public fun name(badge: &Badge): String {
        badge.name.clone()
    }

    public fun badge_type(badge: &Badge): String {
        badge.badge_type.clone()
    }

    public fun info(badge: &Badge): (&String, &String, &String, &String, address, u64) {
        (&badge.name, &badge.description, &badge.badge_type, &badge.image_url, badge.issued_to, badge.issued_at)
    }
}
