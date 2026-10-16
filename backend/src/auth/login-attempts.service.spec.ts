import { LoginAttempts } from './login-attempts.service';

// Unit tests: the clock is passed in, so "a minute later" doesn't mean waiting a minute
describe('LoginAttempts', () => {
  const EMAIL = 'me@test.com';
  const T = 1_000_000; // any starting time

  it('allows 3 wrong passwords, then refuses the 4th try', () => {
    const attempts = new LoginAttempts();
    for (let i = 0; i < 3; i++) {
      expect(() => attempts.assertAllowed(EMAIL, T + i)).not.toThrow();
      attempts.recordWrong(EMAIL, T + i);
    }

    expect(() => attempts.assertAllowed(EMAIL, T + 3)).toThrow('Too many wrong passwords. Try again in a minute.');
  });

  it('unlocks once the wrong tries are more than a minute old', () => {
    const attempts = new LoginAttempts();
    [0, 1, 2].forEach((i) => attempts.recordWrong(EMAIL, T + i));

    expect(() => attempts.assertAllowed(EMAIL, T + 59_000)).toThrow();
    expect(() => attempts.assertAllowed(EMAIL, T + 61_000)).not.toThrow();
  });

  it('a correct login clears the count', () => {
    const attempts = new LoginAttempts();
    [0, 1].forEach((i) => attempts.recordWrong(EMAIL, T + i));

    attempts.clear(EMAIL);
    attempts.recordWrong(EMAIL, T + 2);

    expect(() => attempts.assertAllowed(EMAIL, T + 3)).not.toThrow(); // only 1 wrong try counts now
  });

  it('counts each email separately', () => {
    const attempts = new LoginAttempts();
    [0, 1, 2].forEach((i) => attempts.recordWrong(EMAIL, T + i));

    expect(() => attempts.assertAllowed('someone-else@test.com', T + 3)).not.toThrow();
  });
});
