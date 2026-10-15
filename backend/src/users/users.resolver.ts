import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from './user.entity';
import { SingleUserGuard } from '../auth/single-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(SingleUserGuard)
@Resolver(() => User)
export class UsersResolver {
  // Who you are. Mostly useful for checking the API and database are connected.
  @Query(() => User)
  me(@CurrentUser() user: User): User {
    return user;
  }
}
