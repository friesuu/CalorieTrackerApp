import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyLog } from './daily-log.entity';
import { LogEntry } from './log-entry.entity';

// The daily log (step 5 adds its service and resolver here).
// Both entities are registered together because a DailyLog links to its LogEntries:
// TypeORM needs to know both, or it can't build the link.
@Module({
  imports: [TypeOrmModule.forFeature([DailyLog, LogEntry])],
  exports: [TypeOrmModule], // lets other modules (e.g. profiles) use these repositories
})
export class DailyLogsModule {}
