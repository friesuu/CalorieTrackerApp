import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyLog } from './daily-log.entity';
import { LogEntry } from './log-entry.entity';
import { Exercise } from './exercise.entity';
import { DailyLogsService } from './daily-logs.service';
import { DailyLogsResolver } from './daily-logs.resolver';
import { LogEntriesResolver } from './log-entries.resolver';
import { ExercisesService } from './exercises.service';
import { ExercisesResolver } from './exercises.resolver';
import { Food } from '../foods/food.entity';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { FoodsModule } from '../foods/foods.module';

// The daily log. DailyLog, LogEntry and Exercise are registered together because a DailyLog links to its
// entries and exercise: TypeORM needs to know all three, or it can't build the links.
// Exercise lives here (not in a module of its own) because it's part of a day.
@Module({
  imports: [
    TypeOrmModule.forFeature([DailyLog, LogEntry, Exercise, Food]), // Food: entries copy from it, recent foods list it
    AuthModule, // GqlAuthGuard needs AuthService
    ProfilesModule, // a new day's target comes from the profile
    FoodsModule, // which foods you may log (your own and the starter foods)
  ],
  providers: [DailyLogsService, DailyLogsResolver, LogEntriesResolver, ExercisesService, ExercisesResolver],
})
export class DailyLogsModule {}
