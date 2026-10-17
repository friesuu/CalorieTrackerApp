import { Args, Int, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { DailyLog } from './daily-log.entity';
import { ExercisesService } from './exercises.service';
import { AddExerciseDto, ExerciseDto } from './exercise.dto';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

// Only mutations: exercise is read as part of a day (dailyLog { exercises burnedKcal budgetKcal })
@UseGuards(GqlAuthGuard)
@Resolver()
export class ExercisesResolver {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Mutation(() => DailyLog)
  addExercise(@Args('input') input: AddExerciseDto, @CurrentUser() user: User): Promise<DailyLog> {
    return this.exercisesService.add(input, user);
  }

  @Mutation(() => DailyLog)
  updateExercise(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: ExerciseDto,
    @CurrentUser() user: User,
  ): Promise<DailyLog> {
    return this.exercisesService.update(id, input, user);
  }

  @Mutation(() => DailyLog)
  deleteExercise(@Args('id', { type: () => Int }) id: number, @CurrentUser() user: User): Promise<DailyLog> {
    return this.exercisesService.remove(id, user);
  }
}
