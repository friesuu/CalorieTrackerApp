import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const MAX_WRONG = 3; // wrong passwords allowed...
const WINDOW_MS = 60 * 1000; // ...within one minute

// Stops someone guessing a password over and over: after 3 wrong passwords for an email within a minute,
// that email can't log in until the minute is up. A correct login clears the count.
// Counted per email (not per request), so correct logins are never slowed down.
// Kept in memory: it resets when the server restarts, and would need a shared store (e.g. Redis)
// if the API ever ran on more than one server.
@Injectable()
export class LoginAttempts {
  // email → times (ms) of its recent wrong passwords
  private readonly wrong = new Map<string, number[]>();

  // Call BEFORE checking the password: refuses while the email is locked
  assertAllowed(email: string, now = Date.now()): void {
    if (this.recent(email, now).length >= MAX_WRONG) {
      throw new HttpException('Too many wrong passwords. Try again in a minute.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  recordWrong(email: string, now = Date.now()): void {
    this.wrong.set(email, [...this.recent(email, now), now]);
  }

  clear(email: string): void {
    this.wrong.delete(email);
  }

  // Only the wrong tries from the last minute count
  private recent(email: string, now: number): number[] {
    return (this.wrong.get(email) ?? []).filter((time) => now - time < WINDOW_MS);
  }
}
