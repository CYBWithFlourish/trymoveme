export declare class DockerService {
    private docker;
    constructor();
    startSession(roomId: string, userMnemonic: string): Promise<{
        containerId: any;
        rpcUrl: string;
    }>;
    executeCode(containerId: string, code: string): Promise<unknown>;
    stopContainer(containerId: string): Promise<void>;
}
