import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

@InputType('CreateFoodInput') // the name GraphQL shows
export class CreateFoodDto {
  // Required. Trimmed first, so a name of only spaces becomes "" and fails @IsNotEmpty
  @Field()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100) // the same limit as the form and the database column
  name: string;

  // Serving size and unit are both optional: a food without them counts as "1 serving"
  @Field(() => Float, { nullable: true }) // may be left out, or sent as null
  @IsOptional() // skip the rules below when it's missing or null
  @IsNumber()
  @IsPositive()
  @Max(10000)
  servingSize?: number | null; // ? = may be missing; | null = or null

  @Field(() => String, { nullable: true })
  // Trim, and turn an empty unit ("" or "   ") into null, so "no unit" is always stored the same way
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value))
  @IsOptional()
  @IsString()
  @MaxLength(30)
  servingUnit?: string | null;

  // Int = GraphQL itself refuses decimals (HTTP 400) and makes it required. 0 is fine: water, black coffee.
  @Field(() => Int)
  @Min(0)
  @Max(5000)
  kcalPerServing: number;

  // Macros are optional (most foods won't have them). 0 g is a real value, e.g. no fat in rice.
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(1000)
  proteinG?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(1000)
  carbsG?: number | null;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(1000)
  fatG?: number | null;
}
