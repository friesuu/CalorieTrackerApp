import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './profile.entity';
import { ProfilesService } from './profiles.service';
import { ProfilesResolver } from './profiles.resolver';
import { UsersModule } from '../users/users.module';
import { DailyLog } from '../daily-logs/daily-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile, DailyLog]), // DailyLog: saving a profile updates today's target
    UsersModule, // SingleUserGuard needs UsersService
  ],
  providers: [ProfilesService, ProfilesResolver],
  exports: [ProfilesService], // the daily log uses it for a new day's target
})
export class ProfilesModule {}
