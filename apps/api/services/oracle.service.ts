import { Injectable } from '@nestjs/common';
import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import axios from 'axios';

@Injectable()
export class OracleService {
  private client: SuiClient;
  private keypair: Ed25519Keypair;
  
  // Load these from .env
  private packageId = process.env.PACKAGE_ID; 
  private oracleCap = process.env.ORACLE_CAP_ID;
  private adminMnemonic = process.env.ADMIN_MNEMONIC; 

  constructor() {
    this.client = new SuiClient({ url: 'https://fullnode.devnet.sui.io' });
    
    // Initialize Admin Keypair (The one that owns OracleCap)
    if (this.adminMnemonic) {
        this.keypair = Ed25519Keypair.deriveKeypair(this.adminMnemonic);
    }
  }

  // Upload to Walrus
  async uploadEvidence(code: string): Promise<string> {
    const publisher = 'https://publisher.walrus-devnet.walrus.space';
    
    try {
        const response = await axios.put(`${publisher}/v1/store`, code);
        
        // Walrus response parsing
        if (response.data.newlyCreated) {
            return response.data.newlyCreated.blobObject.blobId;
        } else if (response.data.alreadyCertified) {
            return response.data.alreadyCertified.blobId;
        }
        throw new Error('Invalid Walrus Response');
    } catch (e) {
        console.error("Walrus Error", e);
        return "fake_blob_id_for_mvp_if_walrus_fails";
    }
  }

  // Mint the Proof on Sui
  async mintProof(userAddr: string, roomId: string, blobId: string) {
    if (!this.keypair) throw new Error("Admin wallet not configured");

    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${this.packageId}::core::seal_victory`,
      arguments: [
        tx.object(this.oracleCap!), // The capability
        tx.pure(userAddr),          // The winner
        tx.pure(roomId),            // The room ID
        tx.pure(blobId)             // The Walrus ID
      ],
    });

    const result = await this.client.signAndExecuteTransactionBlock({
      signer: this.keypair,
      transactionBlock: tx,
    });
    
    return result.digest;
  }
}