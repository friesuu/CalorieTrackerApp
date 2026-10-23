import { Args, Context, Mutation, Query, Resolver } from "@nestjs/graphql";
import { User } from "../users/user.entity";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./register.dto";
import { LoginDto } from "./login.dto";
import { ChangePasswordDto } from "./change-password.dto";
import type { Response } from 'express';
import { UseGuards } from "@nestjs/common";
import { GqlAuthGuard } from "./gql-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import { AUTH_COOKIE } from "./auth-cookies";

// Shared by setting and clearing the cookie: browsers only clear a cookie if the options match
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

// Login and change-password both hand out a token the same way
function setLoginCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, { ...COOKIE_OPTIONS, maxAge: COOKIE_MAX_AGE });
}

@Resolver(() => User)
export class AuthResolver
{
    constructor(private readonly authService: AuthService){}

    // Signing up also logs you in (sets the cookie)
    @Mutation(() => User)
    async register(@Args('input') input: RegisterDto, @Context() ctx: { res: Response }): Promise<User> {
        const { user, token } = await this.authService.register(input);
        setLoginCookie(ctx.res, token);
        return user;
    }

    // Wrong passwords are limited in AuthService (3 a minute per email)
    @Mutation(() => User)
    async login(@Args('input') input: LoginDto, @Context() ctx: { res: Response }): Promise<User>
    {
        const { user, token } = await this.authService.login(input);
        setLoginCookie(ctx.res, token);
        return user;
    }

    @Query(() => User)
    @UseGuards(GqlAuthGuard)
    me(@CurrentUser() user: User): User
    {
        return user;
    }

    @Mutation(() => Boolean)
    logout(@Context() ctx: { res: Response }): boolean
    {
        ctx.res.clearCookie(AUTH_COOKIE, COOKIE_OPTIONS);
        return true;
    }

    // Logged in only (guard). Other devices are logged out; this one gets a fresh cookie and stays in.
    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    async changePassword(
        @CurrentUser() user: User,
        @Args('input') input: ChangePasswordDto,
        @Context() ctx: { res: Response },
    ): Promise<boolean>
    {
        const token = await this.authService.changePassword(user, input);
        setLoginCookie(ctx.res, token);
        return true;
    }
}
