import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../users/user.entity';

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  GqlExecutionContext.create(context).getContext<{ req: { user: User } }>().req.user,
);

// Gives resolver methods the current user. Only works on resolvers protected by a guard
// that sets req.user (GqlAuthGuard). Same file as in the task board.
