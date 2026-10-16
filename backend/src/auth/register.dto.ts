import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, MinLength, MaxLength, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";

@InputType('RegisterInput')
export class RegisterDto {
  @Field()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @Field()
  @MinLength(8)
  @MaxLength(128) //
  password: string;

  @Field()
  @MaxLength(50)
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;
}