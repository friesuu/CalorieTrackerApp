import { InputType, PartialType } from '@nestjs/graphql';
import { CreateFoodDto } from './create-food.dto';

// Same fields and rules as CreateFoodInput, but every field is optional: send only what changes
@InputType('UpdateFoodInput')
export class UpdateFoodDto extends PartialType(CreateFoodDto) {}
