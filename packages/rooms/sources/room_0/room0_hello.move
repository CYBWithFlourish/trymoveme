module trymoveme::room0_hello {
    use std::vector;
    use sui::event;
    use sui::tx_context::{Self, TxContext};

    /// Minimal hello-world lab: emits an event when called.
    struct HelloEvent has copy, drop, store { msg: vector<u8> }

    public entry fun hello(ctx: &mut TxContext) {
        event::emit(HelloEvent { msg: b"hello_room0".to_vector() }, ctx);
    }
}
