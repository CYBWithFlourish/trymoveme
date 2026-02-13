export declare class OracleService {
    private client;
    private keypair;
    private packageId;
    private oracleCap;
    private adminMnemonic;
    constructor();
    uploadEvidence(code: string): Promise<string>;
    mintProof(userAddr: string, roomId: string, blobId: string): Promise<any>;
}
