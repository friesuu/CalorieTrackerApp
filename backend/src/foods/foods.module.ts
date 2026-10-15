import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from './food.entity';
import { FoodsService } from './foods.service';
import { FoodsResolver } from './foods.resolver';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Food]), UsersModule], // UsersModule: SingleUserGuard needs UsersService
  providers: [FoodsService, FoodsResolver],
})
export class FoodsModule {}
