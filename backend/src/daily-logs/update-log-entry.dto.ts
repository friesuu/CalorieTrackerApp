import { Field, Float, InputType } from '@nestjs/graphql';
import { IsEnum, IsOptional, IsPositive, Max } from 'class-validator';
import { Meal } from './meal.enum';

// Change how much, or move it to another meal (or both). A different food = remove it and add the other one.
@InputType('UpdateLogEntryInput')
export class UpdateLogEntryDto {
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsPositive()
  @Max(100)
  quantity?: number | null;

  @Field(() => Meal, { nullable: true })
  @IsOptional()
  @IsEnum(Meal)
  meal?: Meal | null;
}
