import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import { TracesModule } from './traces/traces.module';
import { PromptsModule } from './prompts/prompts.module';
import { TeamsModule } from './teams/teams.module';
import { ProjectsModule } from './projects/projects.module';
import { SharingModule } from './sharing/sharing.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { WebSocketModule } from './websocket/websocket.module';
import { PreferencesModule } from './preferences/preferences.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { HealthController } from './health/health.controller';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    SessionsModule,
    TracesModule,
    PromptsModule,
    TeamsModule,
    ProjectsModule,
    SharingModule,
    CollaborationModule,
    WebSocketModule,
    PreferencesModule,
    BookmarksModule,
  ],
  controllers: [HealthController],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
