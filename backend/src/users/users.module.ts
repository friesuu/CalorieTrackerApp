import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Food } from '../foods/food.entity';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([User, Food])], // Food: a new user gets the basic foods
  providers: [UsersService, UsersResolver],
  exports: [UsersService], // lets other modules use SingleUserGuard, which needs it
})
export class UsersModule {}
