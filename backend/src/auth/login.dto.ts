import { Field, InputType } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

@InputType('LoginInput')
export class LoginDto
{
    @Field()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    @IsEmail()
    email: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    @MaxLength(128)
    password: string;
}