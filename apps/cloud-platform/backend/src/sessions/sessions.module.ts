import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { DebugService } from '../debug/debug.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SessionsController],
  providers: [SessionsService, DebugService],
  exports: [SessionsService],
})
export class SessionsModule {}
