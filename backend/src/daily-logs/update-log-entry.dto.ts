import { Field, Float, InputType } from '@nestjs/graphql';
import { IsPositive, Max } from 'class-validator';

// Only the quantity can change. A different food = remove the entry and add the other one.
@InputType('UpdateLogEntryInput')
export class UpdateLogEntryDto {
  @Field(() => Float)
  @IsPositive()
  @Max(100)
  quantity: number;
}
