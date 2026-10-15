import { registerEnumType } from '@nestjs/graphql';

// How much weight to lose per week
export enum Goal {
  MAINTAIN = 'maintain',
  LOSE_0_25 = 'lose_0_25', // 0.25 kg a week
  LOSE_0_5 = 'lose_0_5', // 0.5 kg a week
  LOSE_0_75 = 'lose_0_75', // 0.75 kg a week
}

registerEnumType(Goal, { name: 'Goal' });
