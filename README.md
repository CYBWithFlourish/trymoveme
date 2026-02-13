# TryMoveMe: Gamified Move Security Labs

### "HackTheObject. SecureTheMove::SealTheProof"
TryMoveMe is a browser-first security training platform for the Sui blockchain and Move language. It aims to replicate the TryHackMe-style experience—zero-install, room-based, hands-on labs tailored to Sui's object-centric model.

## Repository at a Glance

- [apps/api](apps/api): NestJS backend that orchestrates per-user Docker labs, runs submitted Move code, and mints Proof-of-Hack tokens via the Sui client.
- [packages/contracts](packages/contracts): Move package (`core`, `kiosk`, `badge` modules) with CadetPass access passes, Proof-of-Hack proofs, Sui-standard kiosk placement/locking, and wallet receipts.
- [docker/base](docker/base): Base image to run Sui inside containers; entrypoint optionally imports a wallet mnemonic for isolated lab sessions.
- [apps/web](apps/web): Placeholder for the browser IDE/dashboard (empty scaffold for now).
- [scripts](scripts): Reserved for automation (currently empty).

## Core Concept

- Rooms/Tracks: Progressive learning paths (Sui Novice, Move Breaker, Auditor) delivered as sandboxed rooms. Each room deploys a vulnerable Move package on the Sui network and guides the user to exploit then patch it.
- Disposable Attack Box: A per-user Docker container runs a local Sui node; the browser terminal/IDE proxies commands into it.
- On-chain Rewards: Successful completions mint SBT `ProofOfHack` objects into a user kiosk (placed+locked via `sui::kiosk`), plus a wallet-level `ProofReceipt` SBT for inventory visibility.

## SEAL Protocol (proof flow)

- Execute: User attack code runs inside an isolated Docker localnet; backend evaluates success conditions (e.g., object ownership change).
- Store: Successful exploit code is uploaded to Walrus; returns `blob_id`.
- Mint: Backend (holding `OracleCap`) calls `core::seal_victory(user_kiosk, owner_cap, winner, room_id, blob_id)` to place+lock `ProofOfHack` in the kiosk and issue a wallet-level `ProofReceipt`.
- Verify: Third parties can read the proof object on-chain, resolve `blob_id` from Walrus, and audit the submitted exploit.

## Current Backend (apps/api)

- Endpoints:
	- `POST /lab/start` — spins up a container for a room using [DockerService](apps/api/services/docker.service.ts#L8-L72); returns container ID and RPC URL.
	- `POST /lab/submit` — writes submitted Move code into the container, builds it, naive win check, then uploads evidence to Walrus and mints on-chain proof via [OracleService](apps/api/services/oracle.service.ts#L9-L75).
- Docker orchestration: Uses the `trymoveme-base:latest` image; binds Sui RPC to a random host port.
- Proof minting and kiosk provisioning: Backend uses `core::provision_kiosk` (admin-gated) to create a Sui-standard kiosk + owner cap at signup, then calls `core::seal_victory` (requires `PACKAGE_ID`, `ORACLE_CAP_ID`, `ADMIN_MNEMONIC`) with the user’s kiosk and owner cap to place+lock the canonical ProofOfHack and issue a wallet-level ProofReceipt SBT.

### MVP Rooms (Sprint 1)

- Room 0: Hello World — publish a generic Move package to localnet; validates Docker orchestration, terminal streaming, wallet funding (see [room0_hello.move](packages/rooms/sources/room_0/room0_hello.move)).
- Room 1: Hot Potato — logic puzzle where a non-drop struct must be consumed; validates verifier, Walrus upload, and Sui proof minting (see [room1_hot_potato.move](packages/rooms/sources/room_1/room1_hot_potato.move)).

### Immediate Next Steps (checklist)

- Docker: Build `trymoveme-base` with entrypoint funding the runtime wallet.
- Sui: Publish `trymoveme::core` to testnet; capture `PACKAGE_ID` and `OracleCapID`.
- Backend: Configure `.env` with admin mnemonic; wire `docker.service.ts` to inject user keys; update calls to pass kiosk + owner cap into `seal_victory`.
- Frontend: Hook “Run” button to `/lab/submit`, stream output, display success/fail; surface kiosk/proof state via wallet+dapp-kit.

### Running the API locally

Prereqs: Docker daemon, Node 20+, npm.

```bash
cd apps/api
npm install
# start dev server
npm run start:dev
```

Environment (create `apps/api/.env`):

```
PACKAGE_ID=<on-chain-package-id>
ORACLE_CAP_ID=<object-id-of-oraclecap>
ADMIN_MNEMONIC="word1 word2 ..."
```

> Note: `apps/api/dist` is currently tracked. Consider adding `apps/api/dist/` to `.gitignore` before the first commit if you want source-only versioning.

## Smart Contracts (packages/contracts)

- Module [core.move](packages/contracts/sources/core.move):
	- `CadetPass` (free mint badge) issued to caller.
	- `ProofOfHack` (SBT-style) sealed by admin `OracleCap`, placed+locked in the user’s Sui-standard kiosk; also mints a wallet-level `ProofReceipt` SBT for visibility.
	- `init` publishes the package and hands the deployer the `OracleCap`.
- Module [kiosk.move](packages/contracts/sources/kiosk.move): thin wrappers around the Sui standard kiosk; helpers to create/provision kiosks and place+lock proofs/badges using `sui::kiosk`.
- Module [badge.move](packages/contracts/sources/badge.move): generic badge SBTs minted and placed+locked into a user’s kiosk (`mint_to_kiosk`), requiring the kiosk owner cap; no transfer API exposed.
- Labs package: [packages/rooms](packages/rooms) contains reference room modules (Room 0 Hello, Room 1 Hot Potato) organized under `sources/room_*/`.
- Flow: user (or backend at signup) mints a kiosk (`kiosk::create` or `core::provision_kiosk`), backend calls `seal_victory` with `&mut kiosk` + owner cap to place+lock proof + mint receipt, then may mint badges into the kiosk when milestones are met.
- Config: [Move.toml](packages/contracts/Move.toml) pins `trymoveme = "0x0"` and pulls Sui framework from testnet branch.

### Labs (reference modules)

- Room 0 Hello: [room0_hello.move](packages/contracts/sources/room0_hello.move) — emits a hello event; use to validate container wiring and `sui move build`.
- Room 1 Hot Potato: [room1_hot_potato.move](packages/contracts/sources/room1_hot_potato.move) — mints a non-drop `HotPotato`; challenge is to relinquish it legally (transfer or cooldown path) without drop ability.

### Build locally

```bash
cd packages/contracts
sui move build
```

## Docker Base Image

- [docker/base/Dockerfile](docker/base/Dockerfile) installs Sui binary (mainnet v1.16.2) on Ubuntu 22.04, initializes `sui client`, and exposes port 9000.
- [docker/base/entrypoint.sh](docker/base/entrypoint.sh) optionally imports `DOCKER_WALLET_MNEMONIC` as `TryMoveMeDocker`, switches the active address, then execs the passed command (e.g., `sui start`).

## Product Blueprint (roadmap snapshot)

- Learning tracks:
	- Sui Novice: Object model, Move syntax, capabilities.
	- Move Breaker: Hot Potato (no-drop structs), Coin Wrapping, ID leakage, logical re-entry.
	- Auditor: Move Prover specs, patch-the-bug labs.
- Gamification:
	- SBT badges on Sui for completions; kiosk-style profile objects.
	- CTF-style win condition: seize a treasure object; verifier checks chain state.
- Phases:
	- Phase 1 (Localhost MVP): Web IDE + 5 labs; compile/publish inside the browser container.
	- Phase 2 (Content Engine): 20+ narrative rooms, Move Prover integration, persistent KOTH server.
	- Phase 3 (Ecosystem): Community room creator, sponsored rooms, grant/partnership support.

## Quick Start Prototype (suggested next step)

- Reuse `trymoveme-base` to host a simple `/lab/start` + `/lab/submit` loop.
- Frontend stub: textarea + run button hitting `/lab/submit`, display compiler output.
- Success criterion: `sui move build` passes; return output stream to the UI.

## Contributing

- Pending CI and linting rules; follow NestJS defaults and Move formatter.
- Secrets: keep mnemonics and `.env` files out of commits; rotate keys used for demos.

---

Status: Technical preview. Looking for feedback on curriculum design, verifier rules, and container isolation model.