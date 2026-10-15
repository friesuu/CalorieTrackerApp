import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Profile } from './profile.entity';
import { ProfilesService } from './profiles.service';
import { SaveProfileDto } from './save-profile.dto';
import { CalorieTarget } from './calorie-target';
import { SingleUserGuard } from '../auth/single-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@UseGuards(SingleUserGuard)
@Resolver(() => Profile)
export class ProfilesResolver {
  constructor(private readonly profilesService: ProfilesService) {}

  // Nullable: no profile yet is a normal answer on first run, not an error
  @Query(() => Profile, { nullable: true })
  profile(@CurrentUser() user: User): Promise<Profile | null> {
    return this.profilesService.findForUser(user.id);
  }

  @Mutation(() => Profile)
  saveProfile(@Args('input') input: SaveProfileDto, @CurrentUser() user: User): Promise<Profile> {
    return this.profilesService.save(input, user);
  }

  // @ResolveField = a field that isn't a database column. It's worked out each time a query asks for it,
  // so age and target are always correct for today and never stored out of date.
  @ResolveField(() => Int)
  age(@Parent() profile: Profile, @CurrentUser() user: User): number {
    return this.profilesService.ageOf(profile, user);
  }

  @ResolveField(() => CalorieTarget)
  target(@Parent() profile: Profile, @CurrentUser() user: User): CalorieTarget {
    return this.profilesService.targetFor(profile, user);
  }
}
