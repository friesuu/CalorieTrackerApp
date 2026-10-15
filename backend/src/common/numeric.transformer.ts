import { ValueTransformer } from 'typeorm';

// PostgreSQL sends NUMERIC columns back as text ("72.5"), because a JS number can't hold every
// exact decimal. Ours are small (a weight, a quantity), so turning them into numbers is safe.
// Used as { transformer: numericTransformer } on every numeric column.
export const numericTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};
