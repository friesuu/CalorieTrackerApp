import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyLog } from './daily-log.entity';
import { LogEntry } from './log-entry.entity';
import { DailyLogsService } from './daily-logs.service';
import { DailyLogsResolver } from './daily-logs.resolver';
import { LogEntriesResolver } from './log-entries.resolver';
import { Food } from '../foods/food.entity';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';

// The daily log. DailyLog and LogEntry are registered together because a DailyLog links to its
// LogEntries: TypeORM needs to know both, or it can't build the link.
@Module({
  imports: [
    TypeOrmModule.forFeature([DailyLog, LogEntry, Food]), // Food: entries copy from it, recent foods list it
    UsersModule, // SingleUserGuard needs UsersService
    ProfilesModule, // a new day's target comes from the profile
  ],
  providers: [DailyLogsService, DailyLogsResolver, LogEntriesResolver],
})
export class DailyLogsModule {}
