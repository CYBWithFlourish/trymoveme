"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@mysten/sui.js/client");
const ed25519_1 = require("@mysten/sui.js/keypairs/ed25519");
const transactions_1 = require("@mysten/sui.js/transactions");
const axios_1 = __importDefault(require("axios"));
let OracleService = class OracleService {
    client;
    keypair;
    packageId = process.env.PACKAGE_ID;
    oracleCap = process.env.ORACLE_CAP_ID;
    adminMnemonic = process.env.ADMIN_MNEMONIC;
    constructor() {
        this.client = new client_1.SuiClient({ url: 'https://fullnode.devnet.sui.io' });
        if (this.adminMnemonic) {
            this.keypair = ed25519_1.Ed25519Keypair.deriveKeypair(this.adminMnemonic);
        }
    }
    async uploadEvidence(code) {
        const publisher = 'https://publisher.walrus-devnet.walrus.space';
        try {
            const response = await axios_1.default.put(`${publisher}/v1/store`, code);
            if (response.data.newlyCreated) {
                return response.data.newlyCreated.blobObject.blobId;
            }
            else if (response.data.alreadyCertified) {
                return response.data.alreadyCertified.blobId;
            }
            throw new Error('Invalid Walrus Response');
        }
        catch (e) {
            console.error("Walrus Error", e);
            return "fake_blob_id_for_mvp_if_walrus_fails";
        }
    }
    async mintProof(userAddr, roomId, blobId) {
        if (!this.keypair)
            throw new Error("Admin wallet not configured");
        const tx = new transactions_1.TransactionBlock();
        tx.moveCall({
            target: `${this.packageId}::core::seal_victory`,
            arguments: [
                tx.object(this.oracleCap),
                tx.pure(userAddr),
                tx.pure(roomId),
                tx.pure(blobId)
            ],
        });
        const result = await this.client.signAndExecuteTransactionBlock({
            signer: this.keypair,
            transactionBlock: tx,
        });
        return result.digest;
    }
};
exports.OracleService = OracleService;
exports.OracleService = OracleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], OracleService);
//# sourceMappingURL=oracle.service.js.map