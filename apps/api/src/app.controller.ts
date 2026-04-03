import { Controller, Post, Body } from '@nestjs/common';
import { DockerService } from './services/docker.service';
import { OracleService } from './services/oracle.service';

@Controller('lab') // This prefixes all routes with /lab
export class AppController {
  constructor(
    private readonly dockerService: DockerService,
    private readonly oracleService: OracleService
  ) {}

  @Post('start')
  async startLab(@Body() body: { roomId: string, userMnemonic?: string }) {
    // For MVP, if user doesn't provide mnemonic, we pass a dummy one or handle in docker
    const mnemonic = body.userMnemonic || "dummy mnemonic for mvp testing"; 
    return this.dockerService.startSession(body.roomId, mnemonic);
  }

  @Post('submit')
  async submitSolution(@Body() body: { userId: string, containerId: string, code: string, kioskId?: string, kioskOwnerCapId?: string }) {
    console.log(`Processing submission for ${body.userId}`);

    // 1. Run the Code in the Container
    const output = await this.dockerService.executeCode(body.containerId, body.code);
    
    console.log("Container Output:", output);

    // 2. CHECK WIN CONDITION
    // For MVP, we check if the build output contains "Success" or doesn't have "error"
    // In the real version, we would check chain state here.
    const isWin = !output.toLowerCase().includes("error");

    if (isWin) {
        console.log("Win detected! Sealing evidence...");
        
        // 3. Upload to Walrus
        const blobId = await this.oracleService.uploadEvidence(body.code);
        
        // 4. Mint Proof on Sui
        const txHash = await this.oracleService.mintProof(body.userId, "room_1", blobId, body.kioskId || "0x0", body.kioskOwnerCapId || "0x0");

        return { status: 'WIN', blobId, txHash, output };
    }

    return { status: 'FAIL', output };
  }
}