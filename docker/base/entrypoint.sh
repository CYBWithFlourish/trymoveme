#!/bin/bash
set -e

# 1. Check if a Mnemonic was passed via Environment Variable
if [ ! -z "$DOCKER_WALLET_MNEMONIC" ]; then
    echo "🔐 specific wallet detected. Importing..."
    
    # Import the key (ed25519 scheme is standard for Sui)
    # We suppress output to avoid logging the private key
    sui keytool import "$DOCKER_WALLET_MNEMONIC" ed25519 --alias TryMoveMeDocker --json > /dev/null

    # Switch the client to use this new address
    sui client switch --address TryMoveMeDocker
    
    echo "✅ Switched to wallet alias: TryMoveMeDocker"
    sui client active-address
else
    echo "⚠️ No mnemonic provided. Using random default wallet generated at build."
fi

# 2. Execute the main command (e.g., 'sui start')
exec "$@"