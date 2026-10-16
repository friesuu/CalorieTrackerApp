import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Food } from './food.entity';
import { FoodsService } from './foods.service';
import { FoodsResolver } from './foods.resolver';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Food]), AuthModule], // AuthModule: GqlAuthGuard needs AuthService
  providers: [FoodsService, FoodsResolver],
  exports: [FoodsService], // the daily log checks which foods you may log
})
export class FoodsModule {}
