import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MealSplitDto } from './meal-split';

// Settings on the Profile page that aren't body details. Each is optional: send only what changes.
@InputType('SettingsInput')
export class SaveSettingsDto {
  // @ValidateNested + @Type: check the rules INSIDE mealSplit too (each 0 to 100, whole numbers).
  // Without them, the ValidationPipe would only check that mealSplit is there.
  @Field(() => MealSplitDto, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => MealSplitDto)
  mealSplit?: MealSplitDto | null;

  // "Add exercise calories to my daily budget"
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  exerciseInBudget?: boolean | null;
}
