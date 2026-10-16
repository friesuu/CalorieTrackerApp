// Relative URL: Vite passes /graphql on to the API (see vite.config.js).
// Same address as the page, so the browser sends the httpOnly login cookie along by itself.
const GRAPHQL_URL = '/graphql';
const USER_FIELDS = 'id name email';

// Fired when a request needs a login and finds none (it expired, or a password change logged this
// device out). App listens for it and goes back to the login screen.
export const SESSION_EXPIRED_EVENT = 'calorie-tracker:session-expired';
const PROFILE_FIELDS = `sex birthDate age heightCm weightKg activityLevel goal
  target { maintenanceKcal goalDeficitKcal minimumKcal targetKcal capped }
  mealSplit { breakfast lunch dinner snack }`;
const FOOD_FIELDS = 'id name servingSize servingUnit kcalPerServing proteinG carbsG fatG';
const ENTRY_FIELDS = 'id foodId name servingSize servingUnit kcalPerServing proteinG carbsG fatG quantity kcal meal';
const DAY_FIELDS = `date targetKcal eatenKcal remainingKcal proteinG carbsG fatG
  entries { ${ENTRY_FIELDS} }
  meals { meal targetKcal eatenKcal entries { ${ENTRY_FIELDS} } }
  unsortedEntries { ${ENTRY_FIELDS} }`;

// Validation errors keep their real messages in originalError (as an array);
// other errors have a readable message directly.
function getErrorMessage(error)
{
    const details = error.extensions?.originalError?.message;

    if (Array.isArray(details))
    {
        return details.join(', ');
    }
    return error.message || 'Something went wrong';
}

// isAuthRequest: logging in, signing up, or asking "who am I?". For those, UNAUTHENTICATED is a normal
// answer (wrong password, not logged in yet), not an expired session, so it doesn't fire the event.
async function graphqlRequest(query, variables, { isAuthRequest = false } = {}) {
  let body;
  try
  {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    body = await response.json();
  }
  catch
  {
    // No answer at all, or not a GraphQL answer (e.g. the API is stopped and Vite's proxy replied instead)
    throw new Error("Can't reach the server. Check that it's running, then try again.");
  }

  // GraphQL often answers 200 even when it fails, so check errors, not response.ok
  if (body.errors)
  {
    const err = new Error(getErrorMessage(body.errors[0]));
    err.code = body.errors[0].extensions?.code; // e.g. 'UNAUTHENTICATED', so callers can tell "not logged in" from other errors
    if (err.code === 'UNAUTHENTICATED' && !isAuthRequest)
    {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw err;
  }
  return body.data;
}

// ---------- Accounts (the server sets and clears the httpOnly cookie; JavaScript never sees the token) ----------

// The logged-in user, or null if nobody is logged in. Any other error (server down...) is thrown.
export async function getMe()
{
    try
    {
        const data = await graphqlRequest(`query { me { ${USER_FIELDS} } }`, undefined, { isAuthRequest: true });
        return data.me;
    }
    catch (err)
    {
        if (err.code === 'UNAUTHENTICATED') return null; // simply not logged in
        throw err; // a real problem: let it show
    }
}

export async function login(email, password)
{
    const data = await graphqlRequest(
        `mutation Login($input: LoginInput!) { login(input: $input) { ${USER_FIELDS} } }`,
        { input: { email, password } },
        { isAuthRequest: true },
    );
    return data.login;
}

// Signing up also logs you in
export async function register(name, email, password)
{
    const data = await graphqlRequest(
        `mutation Register($input: RegisterInput!) { register(input: $input) { ${USER_FIELDS} } }`,
        { input: { name, email, password } },
        { isAuthRequest: true },
    );
    return data.register;
}

// Only the server can delete the cookie (JavaScript can't, because it's httpOnly)
export async function logout()
{
    await graphqlRequest('mutation { logout }', undefined, { isAuthRequest: true });
}

// Needs the current password too. The server sends a fresh cookie, so you stay logged in here,
// while every other device is logged out.
export async function changePassword(currentPassword, newPassword)
{
    await graphqlRequest(
        `mutation ChangePassword($input: ChangePasswordInput!) { changePassword(input: $input) }`,
        { input: { currentPassword, newPassword } },
    );
}

// ---------- Profile ----------

// Settings that aren't body details, e.g. { mealSplit: { breakfast: 25, lunch: 35, dinner: 30, snack: 10 } }
export async function saveSettings(input)
{
    const data = await graphqlRequest(
        `mutation SaveSettings($input: SettingsInput!) { saveSettings(input: $input) { ${PROFILE_FIELDS} } }`,
        { input },
    );
    return data.saveSettings;
}

// The profile with its calorie target, or null on first run (nothing set up yet)
export async function getProfile()
{
    const data = await graphqlRequest(`query { profile { ${PROFILE_FIELDS} } }`);
    return data.profile;
}

// Creates the profile the first time, updates it after. Returns it with the recalculated target.
export async function saveProfile(input)
{
    const data = await graphqlRequest(
        `mutation SaveProfile($input: ProfileInput!) {
            saveProfile(input: $input) { ${PROFILE_FIELDS} }
        }`,
        { input },
    );
    return data.saveProfile;
}

// The whole food library, A to Z
export async function getFoods()
{
    const data = await graphqlRequest(`query { foods { ${FOOD_FIELDS} } }`);
    return data.foods;
}

// Adds a food to the library. Returns it with its new id.
export async function createFood(input)
{
    const data = await graphqlRequest(
        `mutation CreateFood($input: CreateFoodInput!) {
            createFood(input: $input) { ${FOOD_FIELDS} }
        }`,
        { input },
    );
    return data.createFood;
}

// Saves changes to a food. Days it was already logged on keep their own copy.
export async function updateFood(id, changes)
{
    const data = await graphqlRequest(
        `mutation UpdateFood($id: Int!, $input: UpdateFoodInput!) {
            updateFood(id: $id, input: $input) { ${FOOD_FIELDS} }
        }`,
        { id, input: changes },
    );
    return data.updateFood;
}

export async function deleteFood(id)
{
    await graphqlRequest(
        `mutation DeleteFood($id: Int!) {
            deleteFood(id: $id)
        }`,
        { id },
    );
}

// One day's log with its totals. No date = today (the server decides "today", in your time zone).
export async function getDailyLog(date)
{
    const data = await graphqlRequest(
        `query DailyLog($date: String) { dailyLog(date: $date) { ${DAY_FIELDS} } }`,
        { date: date ?? null },
    );
    return data.dailyLog;
}

// The weekly history: the 7 days ending on endDate (no endDate = the 7 days ending today)
export async function getWeek(endDate)
{
    const data = await graphqlRequest(
        `query Week($endDate: String) {
            week(endDate: $endDate) {
                startDate endDate loggedDays averageKcal averageTargetKcal
                days { date eatenKcal targetKcal logged }
            }
        }`,
        { endDate: endDate ?? null },
    );
    return data.week;
}

// The last few different foods you logged, newest first
export async function getRecentFoods()
{
    const data = await graphqlRequest(`query { recentFoods { ${FOOD_FIELDS} } }`);
    return data.recentFoods;
}

// The log changes below all return the whole day, with fresh totals from the server

// input: { foodId, quantity, meal, date }
export async function addLogEntry(input)
{
    const data = await graphqlRequest(
        `mutation AddLogEntry($input: AddLogEntryInput!) {
            addLogEntry(input: $input) { ${DAY_FIELDS} }
        }`,
        { input },
    );
    return data.addLogEntry;
}

// input: { name, kcal, meal, date }
export async function quickAdd(input)
{
    const data = await graphqlRequest(
        `mutation QuickAdd($input: QuickAddInput!) {
            quickAdd(input: $input) { ${DAY_FIELDS} }
        }`,
        { input },
    );
    return data.quickAdd;
}

// changes: { quantity, meal } (either or both). A new meal moves the entry there.
export async function updateLogEntry(id, changes)
{
    const data = await graphqlRequest(
        `mutation UpdateLogEntry($id: Int!, $input: UpdateLogEntryInput!) {
            updateLogEntry(id: $id, input: $input) { ${DAY_FIELDS} }
        }`,
        { id, input: changes },
    );
    return data.updateLogEntry;
}

export async function deleteLogEntry(id)
{
    const data = await graphqlRequest(
        `mutation DeleteLogEntry($id: Int!) {
            deleteLogEntry(id: $id) { ${DAY_FIELDS} }
        }`,
        { id },
    );
    return data.deleteLogEntry;
}
