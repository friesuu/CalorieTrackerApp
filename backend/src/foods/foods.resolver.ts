import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Food } from './food.entity';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './create-food.dto';
import { UpdateFoodDto } from './update-food.dto';
import { SingleUserGuard } from '../auth/single-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@UseGuards(SingleUserGuard)
@Resolver(() => Food)
export class FoodsResolver {
  constructor(private readonly foodsService: FoodsService) {}

  @Query(() => [Food], { name: 'foods' })
  findAll(@CurrentUser() user: User): Promise<Food[]> {
    return this.foodsService.findAll(user.id);
  }

  @Mutation(() => Food)
  createFood(@Args('input') input: CreateFoodDto, @CurrentUser() user: User): Promise<Food> {
    return this.foodsService.create(input, user.id);
  }

  @Mutation(() => Food)
  updateFood(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateFoodDto,
    @CurrentUser() user: User,
  ): Promise<Food> {
    return this.foodsService.update(id, input, user.id);
  }

  @Mutation(() => Boolean)
  async deleteFood(@Args('id', { type: () => Int }) id: number, @CurrentUser() user: User): Promise<boolean> {
    await this.foodsService.remove(id, user.id);
    return true;
  }
}
