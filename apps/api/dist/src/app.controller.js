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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const docker_service_1 = require("./services/docker.service");
const oracle_service_1 = require("./services/oracle.service");
let AppController = class AppController {
    dockerService;
    oracleService;
    constructor(dockerService, oracleService) {
        this.dockerService = dockerService;
        this.oracleService = oracleService;
    }
    async startLab(body) {
        const mnemonic = body.userMnemonic || "dummy mnemonic for mvp testing";
        return this.dockerService.startSession(body.roomId, mnemonic);
    }
    async submitSolution(body) {
        console.log(`Processing submission for ${body.userId}`);
        const output = await this.dockerService.executeCode(body.containerId, body.code);
        console.log("Container Output:", output);
        const isWin = !output.toLowerCase().includes("error");
        if (isWin) {
            console.log("Win detected! Sealing evidence...");
            const blobId = await this.oracleService.uploadEvidence(body.code);
            const txHash = await this.oracleService.mintProof(body.userId, "room_1", blobId);
            return { status: 'WIN', blobId, txHash, output };
        }
        return { status: 'FAIL', output };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Post)('start'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "startLab", null);
__decorate([
    (0, common_1.Post)('submit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "submitSolution", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('lab'),
    __metadata("design:paramtypes", [typeof (_a = typeof docker_service_1.DockerService !== "undefined" && docker_service_1.DockerService) === "function" ? _a : Object, typeof (_b = typeof oracle_service_1.OracleService !== "undefined" && oracle_service_1.OracleService) === "function" ? _b : Object])
], AppController);
//# sourceMappingURL=app.controller.js.map