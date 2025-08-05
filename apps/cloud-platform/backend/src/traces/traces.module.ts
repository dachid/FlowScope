import { Module } from '@nestjs/common';
import { TracesController } from './traces.controller';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [WebSocketModule],
  controllers: [TracesController],
  providers: [],
  exports: [],
})
export class TracesModule {}
