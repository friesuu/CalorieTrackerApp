import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Meal } from './meal.enum';
import { LogEntry } from './log-entry.entity';

// One meal section of a day: its share of the day's target, what's been eaten in it, and its entries.
// Not a table: built from the day's entries each time it's asked for.
@ObjectType()
export class MealSummary {
  @Field(() => Meal)
  meal: Meal;

  @Field(() => Int)
  targetKcal: number;

  @Field(() => Int)
  eatenKcal: number;

  @Field(() => [LogEntry])
  entries: LogEntry[];
}
