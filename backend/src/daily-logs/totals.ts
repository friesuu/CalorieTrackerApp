import { LogEntry } from './log-entry.entity';
import { Exercise } from './exercise.entity';
import { DailyLog } from './daily-log.entity';

// Totals are worked out when asked for, never stored, so they can't get out of step with the entries.

// One entry's calories, as a whole number: 1.5 × 300 kcal = 450
export function entryKcal(entry: LogEntry): number {
  return Math.round(entry.quantity * entry.kcalPerServing);
}

// A day's calories: the sum of the ROUNDED entries, so the rows on screen always add up to the total
export function eatenKcal(entries: LogEntry[]): number {
  return entries.reduce((sum, entry) => sum + entryKcal(entry), 0);
}

// A day's calories burned in exercise
export function burnedKcal(exercises: Exercise[]): number {
  return exercises.reduce((sum, exercise) => sum + exercise.kcal, 0);
}

// What you can eat that day: the target, plus exercise when that day adds it (exerciseInBudget).
// The whole day's budget: the meals keep their share of the target, exercise isn't split between them.
export function budgetKcal(day: Pick<DailyLog, 'targetKcal' | 'exerciseInBudget' | 'exercises'>): number {
  return day.targetKcal + (day.exerciseInBudget ? burnedKcal(day.exercises) : 0);
}

// A day's grams of one macro, from the entries that have it. null = no entry has it (most people don't track).
export function macroTotal(entries: LogEntry[], macro: 'proteinG' | 'carbsG' | 'fatG'): number | null {
  const known = entries.filter((entry) => entry[macro] !== null);
  if (known.length === 0) return null;

  const grams = known.reduce((sum, entry) => sum + entry.quantity * (entry[macro] as number), 0);
  return Math.round(grams * 10) / 10; // one decimal place
}
