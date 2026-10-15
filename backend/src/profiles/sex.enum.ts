import { registerEnumType } from '@nestjs/graphql';

// Only these two because the Mifflin-St Jeor formula has one version for each
export enum Sex {
  FEMALE = 'female',
  MALE = 'male',
}

registerEnumType(Sex, { name: 'Sex' });
