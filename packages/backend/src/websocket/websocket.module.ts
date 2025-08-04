import { Module } from '@nestjs/common';
import { DebugWebSocketGateway } from './websocket.gateway';
import { WebSocketService } from './websocket.service';

@Module({
  controllers: [],
  providers: [DebugWebSocketGateway, WebSocketService],
  exports: [DebugWebSocketGateway, WebSocketService],
})
export class WebSocketModule {}
