import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { Meal } from './meal.enum';
import { Transform } from 'class-transformer';

// Log calories without a library food, e.g. "Hawker dinner, 650 kcal"
@InputType('QuickAddInput')
export class QuickAddDto {
  // Optional. Left out (or blank) = "Quick add"
  @Field(() => String, { nullable: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string | null;

  // Which meal it goes in
  @Field(() => Meal)
  @IsEnum(Meal)
  meal: Meal;

  @Field(() => Int)
  @Min(1)
  @Max(10000)
  kcal: number;

  // Same as AddLogEntryInput: left out = today
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  @IsDateString({ strict: true })
  date?: string | null;
}
