import { Module } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';
import { UserPreferencesController, BookmarksController } from './preferences.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UserPreferencesController, BookmarksController],
  providers: [UserPreferencesService],
  exports: [UserPreferencesService],
})
export class PreferencesModule {}
