import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

// Stands in for a login guard while the app has one user. It puts that user on the request,
// so resolvers get it from @CurrentUser() exactly as they would after logging in.
// Adding login later = replace this with a guard that reads the user from the login cookie
// (like the task board's GqlAuthGuard). No resolver or service has to change.
@Injectable()
export class SingleUserGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { req } = GqlExecutionContext.create(context).getContext<{ req: Request & { user?: User } }>();
    req.user = await this.usersService.defaultUser();
    return true;
  }
}
