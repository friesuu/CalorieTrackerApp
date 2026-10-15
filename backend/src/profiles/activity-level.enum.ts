import { registerEnumType } from '@nestjs/graphql';

export enum ActivityLevel {
  SEDENTARY = 'sedentary', // desk job, little or no exercise
  LIGHT = 'light', // exercise 1–3 days a week
  MODERATE = 'moderate', // exercise 3–5 days a week
  ACTIVE = 'active', // exercise 6–7 days a week
  VERY_ACTIVE = 'very_active', // hard exercise every day, or a physical job
}

registerEnumType(ActivityLevel, { name: 'ActivityLevel' });
