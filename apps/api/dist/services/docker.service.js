"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerService = void 0;
const common_1 = require("@nestjs/common");
const Docker = __importStar(require("dockerode"));
let DockerService = class DockerService {
    docker;
    constructor() {
        this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
    }
    async startSession(roomId, userMnemonic) {
        console.log(`Starting container for room: ${roomId}`);
        const image = 'trymoveme-base:latest';
        const container = await this.docker.createContainer({
            Image: image,
            Env: [
                `DOCKER_WALLET_MNEMONIC=${userMnemonic}`
            ],
            Cmd: ['sui', 'start', '--network.config', '/root/network.yaml'],
            Tty: true,
            HostConfig: {
                PortBindings: {
                    '9000/tcp': [{ HostPort: '0' }]
                },
            },
        });
        await container.start();
        const data = await container.inspect();
        const hostPort = data.NetworkSettings.Ports['9000/tcp'][0].HostPort;
        return {
            containerId: container.id,
            rpcUrl: `http://localhost:${hostPort}`
        };
    }
    async executeCode(containerId, code) {
        const container = this.docker.getContainer(containerId);
        const safeCode = code.replace(/"/g, '\\"');
        const execWrite = await container.exec({
            Cmd: ['sh', '-c', `echo "${safeCode}" > /root/solution.move`],
            AttachStdout: true,
            AttachStderr: true
        });
        await execWrite.start({});
        const execBuild = await container.exec({
            Cmd: ['sh', '-c', 'sui move build'],
            AttachStdout: true,
            AttachStderr: true
        });
        const stream = await execBuild.start({});
        return new Promise((resolve) => {
            let output = "";
            stream.on('data', (chunk) => output += chunk.toString());
            stream.on('end', () => resolve(output));
        });
    }
    async stopContainer(containerId) {
        const container = this.docker.getContainer(containerId);
        await container.stop();
        await container.remove();
    }
};
exports.DockerService = DockerService;
exports.DockerService = DockerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DockerService);
//# sourceMappingURL=docker.service.js.map