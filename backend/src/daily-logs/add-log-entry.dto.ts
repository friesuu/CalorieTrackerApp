import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, Matches, Max } from 'class-validator';
import { Meal } from './meal.enum';

@InputType('AddLogEntryInput')
export class AddLogEntryDto {
  // Which library food. Its name, serving and calories are copied into the entry.
  // @IsInt repeats what GraphQL's Int already checks, but every field needs at least one rule:
  // with whitelist on (app.setup.ts), a field without any is refused as "should not exist".
  @Field(() => Int)
  @IsInt()
  foodId: number;

  // Which meal it goes in
  @Field(() => Meal)
  @IsEnum(Meal)
  meal: Meal;

  // How many servings, e.g. 1.5
  @Field(() => Float)
  @IsPositive()
  @Max(100)
  quantity: number;

  // The day to log on. Left out = today. Past days are fine (forgot to log, supper after midnight);
  // future days are refused in the service, because "today" depends on the user's time zone.
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  @IsDateString({ strict: true })
  date?: string | null;
}
