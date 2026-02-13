import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DockerService } from './services/docker.service';
import { OracleService } from './services/oracle.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()], // Load .env
  controllers: [AppController],
  providers: [
    DockerService, // <--- Register DockerService
    OracleService  // <--- Register OracleService
  ],
})
export class AppModule {}