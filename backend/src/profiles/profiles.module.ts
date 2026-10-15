import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './profile.entity';
import { ProfilesService } from './profiles.service';
import { ProfilesResolver } from './profiles.resolver';
import { UsersModule } from '../users/users.module';
import { DailyLogsModule } from '../daily-logs/daily-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile]),
    UsersModule, // SingleUserGuard needs UsersService
    DailyLogsModule, // saving a profile updates today's target
  ],
  providers: [ProfilesService, ProfilesResolver],
})
export class ProfilesModule {}
