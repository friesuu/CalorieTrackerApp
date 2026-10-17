import { Field, InputType, Int } from '@nestjs/graphql';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

// What you did, for how long, and how many calories it burned. Used as it is to change an exercise
// (all three are sent again, like the form shows them), and with a date to log a new one.
@InputType('ExerciseInput')
export class ExerciseDto {
  // Required. Trimmed first, so a name of only spaces becomes "" and fails @IsNotEmpty
  @Field()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  // Optional (left out or null = not known). A whole day at most.
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  minutes?: number | null;

  // Int = GraphQL itself refuses decimals (HTTP 400) and makes it required.
  // 5,000 is more than a marathon, so anything above it is a typo.
  @Field(() => Int)
  @Min(1)
  @Max(5000)
  kcal: number;
}

// "extends": the same three fields and rules, plus the day
@InputType('AddExerciseInput')
export class AddExerciseDto extends ExerciseDto {
  // Same as AddLogEntryInput: left out = today
  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  @IsDateString({ strict: true })
  date?: string | null;
}
