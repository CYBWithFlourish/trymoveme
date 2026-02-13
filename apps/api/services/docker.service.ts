import { Injectable } from '@nestjs/common';
import * as Docker from 'dockerode';
import * as fs from 'fs';

@Injectable()
export class DockerService {
  private docker: Docker;

  constructor() {
    // connect to local docker socket
    this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
  }

  async startSession(roomId: string, userMnemonic: string) {
    console.log(`Starting container for room: ${roomId}`);
    
    // In a scaled app, we might have different images per room
    // e.g. `trymoveme/${roomId}:latest`
    const image = 'trymoveme-base:latest'; 

    const container = await this.docker.createContainer({
      Image: image,
      // Inject the Mnemonic so the entrypoint.sh can use it
      Env: [
        `DOCKER_WALLET_MNEMONIC=${userMnemonic}`
      ],
      // The CMD is optional here if your Dockerfile already has CMD ["sui", "start"...]
      // But we can be explicit:
      Cmd: ['sui', 'start', '--network.config', '/root/network.yaml'], 
      Tty: true,
      HostConfig: {
        PortBindings: { 
            '9000/tcp': [{ HostPort: '0' }] // '0' assigns a random available port
        }, 
      },
    });

    await container.start();
    
    // Get the assigned random port so the frontend knows where to connect
    const data = await container.inspect();
    const hostPort = data.NetworkSettings.Ports['9000/tcp'][0].HostPort;

    return { 
        containerId: container.id, 
        rpcUrl: `http://localhost:${hostPort}` 
    };
  }

  async executeCode(containerId: string, code: string) {
    const container = this.docker.getContainer(containerId);
    
    // 1. Write the user's code to a file inside the container
    // We escape double quotes to prevent bash errors
    const safeCode = code.replace(/"/g, '\\"');
    
    const execWrite = await container.exec({
      Cmd: ['sh', '-c', `echo "${safeCode}" > /root/solution.move`],
      AttachStdout: true,
      AttachStderr: true
    });
    await execWrite.start({});

    // 2. Run the build command
    const execBuild = await container.exec({
      Cmd: ['sh', '-c', 'sui move build'],
      AttachStdout: true,
      AttachStderr: true
    });

    // Capture the output stream
    const stream = await execBuild.start({});
    
    // Docker returns a stream, for MVP we just return a success message
    // In production, you'd parse this stream to show compiler errors
    return new Promise((resolve) => {
        let output = "";
        stream.on('data', (chunk) => output += chunk.toString());
        stream.on('end', () => resolve(output));
    });
  }
  
  async stopContainer(containerId: string) {
      const container = this.docker.getContainer(containerId);
      await container.stop();
      await container.remove();
  }
}