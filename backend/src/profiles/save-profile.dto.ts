import { Field, Float, InputType } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsNumber, Matches, Max, Min } from 'class-validator';
import { Sex } from './sex.enum';
import { ActivityLevel } from './activity-level.enum';
import { Goal } from './goal.enum';

// Used for both the first save and every edit: all fields are always sent,
// because the target needs all of them
@InputType('ProfileInput')
export class SaveProfileDto {
  @Field(() => Sex)
  @IsEnum(Sex)
  sex: Sex;

  // The age limits (18 to 100) are checked in the service, because they depend on today's date
  @Field()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'birthDate must be in YYYY-MM-DD format',
  })
  @IsDateString({ strict: true })
  birthDate: string;

  @Field(() => Float)
  @IsNumber()
  @Min(100, { message: 'Height must be between 100 and 250 cm' })
  @Max(250, { message: 'Height must be between 100 and 250 cm' })
  heightCm: number;

  @Field(() => Float)
  @IsNumber()
  @Min(30, { message: 'Weight must be between 30 and 300 kg' })
  @Max(300, { message: 'Weight must be between 30 and 300 kg' })
  weightKg: number;

  @Field(() => ActivityLevel)
  @IsEnum(ActivityLevel)
  activityLevel: ActivityLevel;

  @Field(() => Goal)
  @IsEnum(Goal)
  goal: Goal;
}
