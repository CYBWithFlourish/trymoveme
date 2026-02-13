import { DockerService } from './services/docker.service';
import { OracleService } from './services/oracle.service';
export declare class AppController {
    private readonly dockerService;
    private readonly oracleService;
    constructor(dockerService: DockerService, oracleService: OracleService);
    startLab(body: {
        roomId: string;
        userMnemonic?: string;
    }): Promise<any>;
    submitSolution(body: {
        userId: string;
        containerId: string;
        code: string;
    }): Promise<{
        status: string;
        blobId: any;
        txHash: any;
        output: any;
    } | {
        status: string;
        output: any;
        blobId?: undefined;
        txHash?: undefined;
    }>;
}
