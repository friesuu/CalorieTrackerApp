import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest'; // default import: no braces
import { DataSource, IsNull, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module'; // ../ = go up one folder
import { setupApp } from '../src/app.setup';
import { Food } from '../src/foods/food.entity';
import { User } from '../src/users/user.entity';
import { Profile } from '../src/profiles/profile.entity';
import { DailyLog } from '../src/daily-logs/daily-log.entity';
import { LogEntry } from '../src/daily-logs/log-entry.entity';
import { addDays, todayIn } from '../src/common/dates';

// The shared starter foods (made by the Accounts migration), A to Z
const STARTER_FOODS = ['Apple', 'Banana', 'Egg', 'Full cream milk', 'White bread', 'White rice, cooked'];

// Each operation is written once and reused. $name = a variable sent separately.
const PROFILE_FIELDS = `
  sex birthDate age heightCm weightKg activityLevel goal
  target { maintenanceKcal goalDeficitKcal minimumKcal targetKcal capped }
`;

const PROFILE = `
  query {
    profile { ${PROFILE_FIELDS} }
  }
`;

const SAVE_PROFILE = `
  mutation SaveProfile($input: ProfileInput!) {
    saveProfile(input: $input) { ${PROFILE_FIELDS} }
  }
`;

const FOOD_FIELDS = 'id name servingSize servingUnit kcalPerServing proteinG carbsG fatG shared';

const FOODS = `
  query {
    foods { ${FOOD_FIELDS} }
  }
`;

const CREATE_FOOD = `
  mutation CreateFood($input: CreateFoodInput!) {
    createFood(input: $input) { ${FOOD_FIELDS} }
  }
`;

const UPDATE_FOOD = `
  mutation UpdateFood($id: Int!, $input: UpdateFoodInput!) {
    updateFood(id: $id, input: $input) { ${FOOD_FIELDS} }
  }
`;

const DELETE_FOOD = `
  mutation DeleteFood($id: Int!) {
    deleteFood(id: $id)
  }
`;

const DAY_FIELDS = `
  date targetKcal eatenKcal remainingKcal proteinG carbsG fatG
  entries { id foodId name servingSize servingUnit kcalPerServing quantity kcal }
`;

const DAILY_LOG = `
  query DailyLog($date: String) {
    dailyLog(date: $date) { ${DAY_FIELDS} }
  }
`;

const ADD_LOG_ENTRY = `
  mutation AddLogEntry($input: AddLogEntryInput!) {
    addLogEntry(input: $input) { ${DAY_FIELDS} }
  }
`;

const QUICK_ADD = `
  mutation QuickAdd($input: QuickAddInput!) {
    quickAdd(input: $input) { ${DAY_FIELDS} }
  }
`;

const UPDATE_LOG_ENTRY = `
  mutation UpdateLogEntry($id: Int!, $input: UpdateLogEntryInput!) {
    updateLogEntry(id: $id, input: $input) { ${DAY_FIELDS} }
  }
`;

const DELETE_LOG_ENTRY = `
  mutation DeleteLogEntry($id: Int!) {
    deleteLogEntry(id: $id) { ${DAY_FIELDS} }
  }
`;

const WEEK = `
  query Week($endDate: String) {
    week(endDate: $endDate) {
      startDate endDate loggedDays averageKcal averageTargetKcal
      days { date eatenKcal targetKcal logged }
    }
  }
`;

const RECENT_FOODS = `
  query {
    recentFoods { name }
  }
`;

const ROTI_CANAI = { name: 'Roti canai', servingSize: 1, servingUnit: 'piece', kcalPerServing: 300 };

const REGISTER = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) { id name email }
  }
`;

const LOGIN = `
  mutation Login($input: LoginInput!) {
    login(input: $input) { id name email }
  }
`;

const ME = `
  query {
    me { id name email }
  }
`;

const CHANGE_PASSWORD = `
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`;

// The account almost every test runs as, and a second one for the privacy tests.
// Both are deleted and signed up again at the start of each run.
const TEST_USER = { name: 'Test User', email: 'e2e@test.com', password: 'e2e-password' };
const OTHER_USER = { name: 'Other User', email: 'e2e-other@test.com', password: 'e2e-password' };

// Born on 1 January exactly 30 years ago, so the age is 30 whenever the tests run
const TODAY = todayIn('Asia/Kuala_Lumpur');
const THIRTY_YEARS_AGO = `${Number(TODAY.slice(0, 4)) - 30}-01-01`;

// A man of 30, 175 cm, 80 kg, moderately active, losing 0.5 kg a week:
// maintenance 2,711 kcal (worked out by hand in calorie-target.spec.ts), target 2,711 − 550 = 2,161
const PROFILE_INPUT = {
  sex: 'MALE',
  birthDate: THIRTY_YEARS_AGO,
  heightCm: 175,
  weightKg: 80,
  activityLevel: 'MODERATE',
  goal: 'LOSE_0_5',
};

describe('Calorie tracker GraphQL API (e2e)', () => {
  let app: INestApplication; // set in beforeAll, used by every test
  let usersRepository: Repository<User>;
  let foodsRepository: Repository<Food>;
  let profilesRepository: Repository<Profile>;
  let dailyLogsRepository: Repository<DailyLog>;
  let logEntriesRepository: Repository<LogEntry>;
  let userId: number; // TEST_USER's id, found in beforeAll
  let cookie: string[] = []; // TEST_USER's login cookie, sent with every request by gql()
  let otherCookie: string[] = []; // OTHER_USER's login cookie, for the privacy tests

  // Runs ONCE before all tests: build and start the app, and bring the test database's
  // tables up to date by running the same migrations as the real database
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app); // same validation and cookies as the real app
    await app.init();

    await app.get(DataSource).runMigrations();
    usersRepository = app.get(getRepositoryToken(User));
    foodsRepository = app.get(getRepositoryToken(Food));
    profilesRepository = app.get(getRepositoryToken(Profile));
    dailyLogsRepository = app.get(getRepositoryToken(DailyLog));
    logEntriesRepository = app.get(getRepositoryToken(LogEntry));

    // No "user from before accounts" left over, or the first sign-up below would take it over
    await usersRepository.delete({ email: IsNull() });
    cookie = await signUp(TEST_USER);
    otherCookie = await signUp(OTHER_USER);
    userId = (await usersRepository.findOneByOrFail({ email: TEST_USER.email })).id;
  });

  // Runs before EVERY test: no profile and no logged days, like a first run
  beforeEach(async () => {
    await profilesRepository.clear();
    await dailyLogsRepository.createQueryBuilder().delete().execute();
  });

  // Runs ONCE after all tests: shut the app down
  afterAll(async () => {
    await app.close();
  });

  // Every GraphQL call is POST /graphql with { query, variables }, sent as whoever owns the cookie
  const gqlAs = (who: string[], query: string, variables?: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/graphql').set('Cookie', who).send({ query, variables });

  // As TEST_USER (most tests)
  const gql = (query: string, variables?: Record<string, unknown>) => gqlAs(cookie, query, variables);

  // The cookie a response sets (supertest types it as one string, but it can be a list)
  const cookieFrom = (res: { headers: Record<string, unknown> }): string[] => {
    const setCookie = res.headers['set-cookie'] as string | string[];
    return Array.isArray(setCookie) ? setCookie : [setCookie];
  };

  // A fresh account: remove the one from the last run (its data goes too: ON DELETE CASCADE),
  // sign up again, and return the login cookie. Fails loudly here if signing up is broken.
  const signUp = async (person: { name: string; email: string; password: string }) => {
    await usersRepository.delete({ email: person.email });
    const res = await gqlAs([], REGISTER, { input: person }).expect(200);
    expect(res.body.errors).toBeUndefined();
    return cookieFrom(res);
  };

  // Back to no foods of the test user's own (the shared starter foods are always there)
  const resetFoods = async () => {
    await foodsRepository.delete({ ownerId: userId });
  };

  // A food of the test user's own (starter foods can't be edited or deleted, so tests that do that use this)
  const ownFood = (overrides: Partial<Food> = {}) => foodsRepository.save({ ...ROTI_CANAI, ownerId: userId, ...overrides });

  // The id of a starter food (or one of the user's own), e.g. idOf('Egg')
  const idOf = async (name: string): Promise<number> =>
    (await foodsRepository.findOneOrFail({ where: [{ ownerId: userId, name }, { ownerId: IsNull(), name }] })).id;

  const foodNames = async (): Promise<string[]> => {
    const res = await gql(FOODS).expect(200);
    expect(res.body.errors).toBeUndefined();
    return res.body.data.foods.map((f: { name: string }) => f.name);
  };

  // Error shapes (same as the task board):
  //   rejected by the schema      -> HTTP 400, extensions.code BAD_USER_INPUT
  //   rejected by ValidationPipe  -> HTTP 200, data null, messages in extensions.originalError.message
  //   thrown by the service       -> HTTP 200, data null, message in errors[0].message

  describe('profile', () => {
    it('is null before it has been set up (first run)', async () => {
      const res = await gql(PROFILE).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.profile).toBeNull();
    });

    it('saves a profile and shows how the target was worked out', async () => {
      const res = await gql(SAVE_PROFILE, { input: PROFILE_INPUT }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.saveProfile.age).toBe(30);
      expect(res.body.data.saveProfile.target).toEqual({
        maintenanceKcal: 2711,
        goalDeficitKcal: 550,
        minimumKcal: 1500,
        targetKcal: 2161,
        capped: false,
      });

      const read = await gql(PROFILE).expect(200);
      expect(read.body.data.profile.weightKg).toBe(80); // a number, not the text "80.0" Postgres sends
    });

    it('editing recalculates, and still keeps just one profile', async () => {
      await gql(SAVE_PROFILE, { input: PROFILE_INPUT }).expect(200);

      const res = await gql(SAVE_PROFILE, { input: { ...PROFILE_INPUT, goal: 'MAINTAIN' } }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.saveProfile.target.targetKcal).toBe(2711); // no deficit any more
      expect(await profilesRepository.countBy({ userId })).toBe(1);
    });

    it('caps the target at the safe minimum and says so', async () => {
      const res = await gql(SAVE_PROFILE, {
        input: { ...PROFILE_INPUT, sex: 'FEMALE', heightCm: 160, weightKg: 50, activityLevel: 'SEDENTARY', goal: 'LOSE_0_75' },
      }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.saveProfile.target.targetKcal).toBe(1200);
      expect(res.body.data.saveProfile.target.capped).toBe(true);
    });

    it("updates today's target, but not past days'", async () => {
      await dailyLogsRepository.save([
        { ownerId: userId, logDate: TODAY, targetKcal: 1800 },
        { ownerId: userId, logDate: '2026-01-01', targetKcal: 1800 },
      ]);

      await gql(SAVE_PROFILE, { input: PROFILE_INPUT }).expect(200);

      expect((await dailyLogsRepository.findOneByOrFail({ ownerId: userId, logDate: TODAY })).targetKcal).toBe(2161);
      expect((await dailyLogsRepository.findOneByOrFail({ ownerId: userId, logDate: '2026-01-01' })).targetKcal).toBe(1800);
    });

    it('rejects anyone under 18', async () => {
      const tenYearsAgo = `${Number(TODAY.slice(0, 4)) - 10}-01-01`;
      const res = await gql(SAVE_PROFILE, { input: { ...PROFILE_INPUT, birthDate: tenYearsAgo } }).expect(200);

      expect(res.body.errors[0].message).toBe('Age must be between 18 and 100');
      expect(await profilesRepository.countBy({ userId })).toBe(0); // and nothing was saved
    });

    it('rejects a height out of range, with a readable message', async () => {
      const res = await gql(SAVE_PROFILE, { input: { ...PROFILE_INPUT, heightCm: 90 } }).expect(200);

      expect(res.body.errors[0].extensions.originalError.message).toContain('Height must be between 100 and 250 cm');
    });

    it('rejects a goal that does not exist (GraphQL itself, HTTP 400)', async () => {
      const res = await gql(SAVE_PROFILE, { input: { ...PROFILE_INPUT, goal: 'LOSE_5' } }).expect(400);

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });
  });

  describe('foods', () => {
    beforeEach(resetFoods);

    it('everyone sees the shared starter foods, marked as shared', async () => {
      const res = await gql(FOODS).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.foods.map((f: { name: string }) => f.name)).toEqual(STARTER_FOODS);
      expect(res.body.data.foods.every((f: { shared: boolean }) => f.shared)).toBe(true);
    });

    it('lists your own foods with the starter foods, A to Z', async () => {
      await ownFood();

      const names = await foodNames();

      expect(names).toEqual([...STARTER_FOODS, 'Roti canai'].sort((a, b) => a.localeCompare(b)));
    });

    it('sends macros as null when they are not known', async () => {
      const res = await gql(FOODS).expect(200);

      expect(res.body.data.foods[0].proteinG).toBeNull();
    });

    it('deletes one of your own foods', async () => {
      const roti = await ownFood();

      const res = await gql(DELETE_FOOD, { id: roti.id }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.deleteFood).toBe(true);
      expect(await foodNames()).not.toContain('Roti canai');
    });

    it("starter foods can't be edited or deleted", async () => {
      const egg = await idOf('Egg');

      const edit = await gql(UPDATE_FOOD, { id: egg, input: { kcalPerServing: 1 } }).expect(200);
      const remove = await gql(DELETE_FOOD, { id: egg }).expect(200);

      expect(edit.body.errors[0].message).toBe("Starter foods are shared with everyone, so they can't be changed");
      expect(remove.body.errors[0].message).toBe("Starter foods are shared with everyone, so they can't be changed");
      expect(await foodNames()).toContain('Egg');
    });

    it('deleting a food keeps the days it was logged on', async () => {
      const roti = await ownFood();
      const day = await dailyLogsRepository.save({ ownerId: userId, logDate: '2026-01-01', targetKcal: 1800 });
      const entry = await logEntriesRepository.save({
        dailyLogId: day.id, foodId: roti.id, name: 'Roti canai', servingSize: 1, servingUnit: 'piece', kcalPerServing: 300, quantity: 2,
      });

      await gql(DELETE_FOOD, { id: roti.id }).expect(200);

      const kept = await logEntriesRepository.findOneByOrFail({ id: entry.id });
      expect(kept.foodId).toBeNull(); // no longer linked to the library...
      expect(kept.name).toBe('Roti canai'); // ...but still says what you ate
      expect(kept.kcalPerServing).toBe(300);
    });

    it('says which food was not found', async () => {
      const res = await gql(DELETE_FOOD, { id: 999999 }).expect(200);

      expect(res.body.errors[0].message).toBe('Food 999999 not found');
    });
  });

  describe('createFood', () => {
    beforeEach(resetFoods);

    it('adds a food to your library, not shared', async () => {
      const res = await gql(CREATE_FOOD, { input: ROTI_CANAI }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createFood).toMatchObject({ ...ROTI_CANAI, proteinG: null, carbsG: null, fatG: null, shared: false });
      expect(await foodNames()).toContain('Roti canai');
    });

    it('keeps protein, carbs and fat when they are given', async () => {
      const res = await gql(CREATE_FOOD, { input: { ...ROTI_CANAI, proteinG: 6.5, carbsG: 38, fatG: 13.2 } }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createFood).toMatchObject({ proteinG: 6.5, carbsG: 38, fatG: 13.2 });
    });

    it('trims spaces around the name and unit', async () => {
      const res = await gql(CREATE_FOOD, { input: { ...ROTI_CANAI, name: '  Roti canai  ', servingUnit: ' piece ' } }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createFood.name).toBe('Roti canai');
      expect(res.body.data.createFood.servingUnit).toBe('piece');
    });

    it('can leave out the serving size and unit (counts as "1 serving")', async () => {
      const res = await gql(CREATE_FOOD, { input: { name: 'Nasi lemak', kcalPerServing: 650 } }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createFood).toMatchObject({ servingSize: null, servingUnit: null });
    });

    it('saves a blank unit as no unit', async () => {
      const res = await gql(CREATE_FOOD, { input: { ...ROTI_CANAI, servingUnit: '   ' } }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createFood.servingUnit).toBeNull();
    });

    it('rejects an empty name with a readable message, and saves nothing', async () => {
      const before = await foodsRepository.countBy({ ownerId: userId });

      const res = await gql(CREATE_FOOD, { input: { ...ROTI_CANAI, name: '   ' } }).expect(200);

      // A validation message, not a database error: only spaces should count as empty
      expect(res.body.errors[0].extensions.originalError.message).toContain('name should not be empty');
      expect(await foodsRepository.countBy({ ownerId: userId })).toBe(before);
    });

    it('accepts a name of up to 100 characters (the same limit as the form and the table)', async () => {
      const res = await gql(CREATE_FOOD, { input: { ...ROTI_CANAI, name: 'x'.repeat(100) } }).expect(200);

      expect(res.body.errors).toBeUndefined();
    });

    it('accepts 0 kcal, e.g. water or black coffee', async () => {
      const res = await gql(CREATE_FOOD, { input: { name: 'Water', kcalPerServing: 0 } }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createFood.kcalPerServing).toBe(0);
    });

    it('accepts 0 g of a macro, e.g. no fat in rice', async () => {
      const res = await gql(CREATE_FOOD, { input: { ...ROTI_CANAI, fatG: 0 } }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createFood.fatG).toBe(0);
    });

    it('rejects negative calories', async () => {
      const res = await gql(CREATE_FOOD, { input: { ...ROTI_CANAI, kcalPerServing: -5 } }).expect(200);

      expect(res.body.errors).toBeDefined();
    });

    it('rejects a serving size of 0', async () => {
      const res = await gql(CREATE_FOOD, { input: { ...ROTI_CANAI, servingSize: 0 } }).expect(200);

      expect(res.body.errors).toBeDefined();
    });

    it('only takes whole calories (GraphQL itself, HTTP 400)', async () => {
      const res = await gql(CREATE_FOOD, { input: { ...ROTI_CANAI, kcalPerServing: 300.5 } }).expect(400);

      expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    });

    it('rejects a name already in your library, or already a starter food', async () => {
      await ownFood();

      const own = await gql(CREATE_FOOD, { input: ROTI_CANAI }).expect(200);
      const starter = await gql(CREATE_FOOD, { input: { ...ROTI_CANAI, name: 'Egg' } }).expect(200);

      expect(own.body.errors[0].message).toBe('You already have a food called "Roti canai"');
      expect(starter.body.errors[0].message).toBe('"Egg" is already one of the starter foods');
    });
  });

  describe('updateFood', () => {
    beforeEach(resetFoods);

    it('changes only what is sent', async () => {
      const roti = await ownFood();

      const res = await gql(UPDATE_FOOD, { id: roti.id, input: { kcalPerServing: 280, proteinG: 6.3 } }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateFood).toMatchObject({ name: 'Roti canai', servingUnit: 'piece', kcalPerServing: 280, proteinG: 6.3 });
    });

    it('can clear the serving size and unit', async () => {
      const roti = await ownFood();

      const res = await gql(UPDATE_FOOD, { id: roti.id, input: { servingSize: null, servingUnit: null } }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateFood).toMatchObject({ servingSize: null, servingUnit: null });
    });

    it("can keep its own name, but not take another food's", async () => {
      const roti = await ownFood();
      await ownFood({ name: 'Teh tarik' });

      const same = await gql(UPDATE_FOOD, { id: roti.id, input: { name: 'Roti canai' } }).expect(200);
      const own = await gql(UPDATE_FOOD, { id: roti.id, input: { name: 'Teh tarik' } }).expect(200);
      const starter = await gql(UPDATE_FOOD, { id: roti.id, input: { name: 'Banana' } }).expect(200);

      expect(same.body.errors).toBeUndefined();
      expect(own.body.errors[0].message).toBe('You already have a food called "Teh tarik"');
      expect(starter.body.errors[0].message).toBe('"Banana" is already one of the starter foods');
    });

    it('refuses to empty the name or calories', async () => {
      const roti = await ownFood();

      const res = await gql(UPDATE_FOOD, { id: roti.id, input: { name: null } }).expect(200);

      expect(res.body.errors[0].message).toBe('Name and calories cannot be empty');
    });

    it('says which food was not found', async () => {
      const res = await gql(UPDATE_FOOD, { id: 999999, input: { kcalPerServing: 1 } }).expect(200);

      expect(res.body.errors[0].message).toBe('Food 999999 not found');
    });
  });

  describe('daily log', () => {
    const YESTERDAY = addDays(TODAY, -1);

    // Every test starts with no foods of the user's own and the 2,161 kcal profile (see PROFILE_INPUT)
    beforeEach(async () => {
      await resetFoods();
      await gql(SAVE_PROFILE, { input: PROFILE_INPUT }).expect(200);
    });

    const addEntry = async (input: Record<string, unknown>) => {
      const res = await gql(ADD_LOG_ENTRY, { input }).expect(200);
      expect(res.body.errors).toBeUndefined();
      return res.body.data.addLogEntry;
    };

    it('needs a profile first (the target comes from it)', async () => {
      await profilesRepository.clear();

      const res = await gql(DAILY_LOG).expect(200);

      expect(res.body.errors[0].message).toBe('Set up your profile first');
    });

    it("today starts empty, with today's date and the full target left", async () => {
      const res = await gql(DAILY_LOG).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.dailyLog).toEqual({
        date: TODAY,
        targetKcal: 2161,
        eatenKcal: 0,
        remainingKcal: 2161,
        proteinG: null,
        carbsG: null,
        fatG: null,
        entries: [],
      });
    });

    it('logs a starter food, copying its details, and returns the new totals', async () => {
      const day = await addEntry({ foodId: await idOf('Egg'), quantity: 2 });

      expect(day.entries).toEqual([
        expect.objectContaining({ name: 'Egg', servingSize: 1, servingUnit: 'large', kcalPerServing: 72, quantity: 2, kcal: 144 }),
      ]);
      expect(day.eatenKcal).toBe(144);
      expect(day.remainingKcal).toBe(2161 - 144);
    });

    it('rounds each entry to whole calories, and the total adds up the rounded rows', async () => {
      // 1.5 × 105 = 157.5 → 158, and 1.5 × 95 = 142.5 → 143: 301 (not the unrounded 300)
      await addEntry({ foodId: await idOf('Banana'), quantity: 1.5 });
      const day = await addEntry({ foodId: await idOf('Apple'), quantity: 1.5 });

      expect(day.entries.map((e: { kcal: number }) => e.kcal)).toEqual([158, 143]);
      expect(day.eatenKcal).toBe(301);
    });

    it('adding a food that is already in the day adds to its servings (one row, not two)', async () => {
      const egg = await idOf('Egg');
      await addEntry({ foodId: egg, quantity: 1 });
      const day = await addEntry({ foodId: egg, quantity: 1.5 });

      expect(day.entries).toEqual([expect.objectContaining({ name: 'Egg', quantity: 2.5, kcal: 180 })]);
      expect(day.eatenKcal).toBe(180);
    });

    it("but a new row if the food's details changed since it was logged", async () => {
      const roti = await ownFood();
      await addEntry({ foodId: roti.id, quantity: 1 });
      await gql(UPDATE_FOOD, { id: roti.id, input: { kcalPerServing: 280 } }).expect(200);

      const day = await addEntry({ foodId: roti.id, quantity: 1 });

      // the first roti keeps the 300 kcal it was logged with
      expect(day.entries.map((e: { kcalPerServing: number }) => e.kcalPerServing)).toEqual([300, 280]);
    });

    it('a new row on a different day, and quick adds never merge', async () => {
      const egg = await idOf('Egg');
      await addEntry({ foodId: egg, quantity: 1, date: YESTERDAY });
      const today = await addEntry({ foodId: egg, quantity: 1 });
      await gql(QUICK_ADD, { input: { kcal: 100 } }).expect(200);
      const withQuick = (await gql(QUICK_ADD, { input: { kcal: 100 } }).expect(200)).body.data.quickAdd;

      expect(today.entries).toHaveLength(1);
      expect(withQuick.entries).toHaveLength(3); // the egg + two separate quick adds
    });

    it('goes negative when over target', async () => {
      const res = await gql(QUICK_ADD, { input: { kcal: 2500 } }).expect(200);

      expect(res.body.data.quickAdd.remainingKcal).toBe(2161 - 2500);
    });

    it('quick add logs calories without a library food', async () => {
      const unnamed = await gql(QUICK_ADD, { input: { kcal: 650 } }).expect(200);
      const named = await gql(QUICK_ADD, { input: { name: '  Hawker dinner  ', kcal: 400 } }).expect(200);

      expect(unnamed.body.errors).toBeUndefined();
      expect(named.body.data.quickAdd.entries).toEqual([
        expect.objectContaining({ name: 'Quick add', foodId: null, servingSize: null, quantity: 1, kcal: 650 }),
        expect.objectContaining({ name: 'Hawker dinner', kcal: 400 }),
      ]);
      expect(named.body.data.quickAdd.eatenKcal).toBe(1050);
    });

    it('changes the quantity of an entry', async () => {
      const day = await addEntry({ foodId: await idOf('Egg'), quantity: 1 });

      const res = await gql(UPDATE_LOG_ENTRY, { id: day.entries[0].id, input: { quantity: 3 } }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateLogEntry.eatenKcal).toBe(216);
    });

    it('removes an entry', async () => {
      const day = await addEntry({ foodId: await idOf('Egg'), quantity: 1 });

      const res = await gql(DELETE_LOG_ENTRY, { id: day.entries[0].id }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.deleteLogEntry.entries).toEqual([]);
      expect(res.body.data.deleteLogEntry.eatenKcal).toBe(0);
    });

    it('logs to yesterday without touching today', async () => {
      const day = await addEntry({ foodId: await idOf('Egg'), quantity: 1, date: YESTERDAY });

      expect(day.date).toBe(YESTERDAY);
      const today = await gql(DAILY_LOG).expect(200);
      expect(today.body.data.dailyLog.eatenKcal).toBe(0);
    });

    it('refuses a day in the future, and a date that does not exist', async () => {
      const future = await gql(ADD_LOG_ENTRY, { input: { foodId: await idOf('Egg'), quantity: 1, date: addDays(TODAY, 1) } }).expect(200);
      const notReal = await gql(DAILY_LOG, { date: '2026-02-30' }).expect(200);

      expect(future.body.errors[0].message).toBe("You can't log a day in the future");
      expect(notReal.body.errors[0].message).toBe('date must be a real date in YYYY-MM-DD format');
    });

    it('editing the food later does not change what was logged', async () => {
      const roti = await ownFood();
      await addEntry({ foodId: roti.id, quantity: 1 });

      await gql(UPDATE_FOOD, { id: roti.id, input: { kcalPerServing: 280 } }).expect(200);

      const day = (await gql(DAILY_LOG).expect(200)).body.data.dailyLog;
      expect(day.entries[0].kcalPerServing).toBe(300);
    });

    it('adds up macros from the entries that have them, null when none do', async () => {
      const eggWithProtein = await ownFood({ name: 'Boiled egg', servingUnit: 'large', kcalPerServing: 78, proteinG: 6.3 });

      await addEntry({ foodId: eggWithProtein.id, quantity: 2 });
      const day = await addEntry({ foodId: await idOf('Apple'), quantity: 1 }); // no macros known

      expect(day.proteinG).toBe(12.6);
      expect(day.fatG).toBeNull();
    });

    it('recent foods: newest first, each food once, deleted foods left out', async () => {
      const roti = await ownFood();
      await addEntry({ foodId: await idOf('Egg'), quantity: 1 });
      await addEntry({ foodId: await idOf('Banana'), quantity: 1 });
      await addEntry({ foodId: await idOf('Egg'), quantity: 1 });
      await addEntry({ foodId: roti.id, quantity: 1 });
      await gql(QUICK_ADD, { input: { kcal: 100 } }).expect(200); // not a library food: never "recent"
      await gql(DELETE_FOOD, { id: roti.id }).expect(200);

      const res = await gql(RECENT_FOODS).expect(200);

      expect(res.body.data.recentFoods.map((f: { name: string }) => f.name)).toEqual(['Egg', 'Banana']);
    });

    it('says which entry or food was not found', async () => {
      const entry = await gql(DELETE_LOG_ENTRY, { id: 999999 }).expect(200);
      const food = await gql(ADD_LOG_ENTRY, { input: { foodId: 999999, quantity: 1 } }).expect(200);

      expect(entry.body.errors[0].message).toBe('Entry 999999 not found');
      expect(food.body.errors[0].message).toBe('Food 999999 not found');
    });

    it('rejects a quantity of 0', async () => {
      const res = await gql(ADD_LOG_ENTRY, { input: { foodId: await idOf('Egg'), quantity: 0 } }).expect(200);

      expect(res.body.errors[0].extensions.originalError.message).toContain('quantity must be a positive number');
    });
  });

  describe('week', () => {
    // The 2,161 kcal profile, like the daily log tests
    beforeEach(async () => {
      await resetFoods();
      await gql(SAVE_PROFILE, { input: PROFILE_INPUT }).expect(200);
    });

    const quickAddOn = async (date: string, kcal: number) => {
      const res = await gql(QUICK_ADD, { input: { kcal, date } }).expect(200);
      expect(res.body.errors).toBeUndefined();
      return res.body.data.quickAdd;
    };

    it('is the 7 days ending today, oldest first, all "not logged" at first', async () => {
      const res = await gql(WEEK).expect(200);

      expect(res.body.errors).toBeUndefined();
      const week = res.body.data.week;
      expect(week.startDate).toBe(addDays(TODAY, -6));
      expect(week.endDate).toBe(TODAY);
      expect(week.days.map((d: { date: string }) => d.date)).toEqual([6, 5, 4, 3, 2, 1, 0].map((n) => addDays(TODAY, -n)));
      expect(week.days.every((d: { logged: boolean }) => !d.logged)).toBe(true);
      expect(week.loggedDays).toBe(0);
      expect(week.averageKcal).toBeNull();
    });

    it("shows each logged day's total against that day's target", async () => {
      await quickAddOn(TODAY, 1800);
      await quickAddOn(TODAY, 300);
      await quickAddOn(addDays(TODAY, -2), 1500);

      const week = (await gql(WEEK).expect(200)).body.data.week;

      expect(week.days[6]).toEqual({ date: TODAY, eatenKcal: 2100, targetKcal: 2161, logged: true });
      expect(week.days[4]).toEqual({ date: addDays(TODAY, -2), eatenKcal: 1500, targetKcal: 2161, logged: true });
      expect(week.days[5]).toEqual({ date: addDays(TODAY, -1), eatenKcal: 0, targetKcal: null, logged: false });
    });

    it('averages only the days that were logged', async () => {
      await quickAddOn(TODAY, 2000);
      await quickAddOn(addDays(TODAY, -3), 1500);

      const week = (await gql(WEEK).expect(200)).body.data.week;

      expect(week.loggedDays).toBe(2);
      expect(week.averageKcal).toBe(1750); // (2000 + 1500) / 2, not / 7
      expect(week.averageTargetKcal).toBe(2161);
    });

    it('keeps each day at the target it had (changing the goal later does not re-judge it)', async () => {
      await quickAddOn(addDays(TODAY, -1), 2000); // yesterday: logged with the 2,161 target
      await gql(SAVE_PROFILE, { input: { ...PROFILE_INPUT, goal: 'MAINTAIN' } }).expect(200); // now 2,711
      await quickAddOn(TODAY, 2000);

      const week = (await gql(WEEK).expect(200)).body.data.week;

      expect(week.days[5].targetKcal).toBe(2161);
      expect(week.days[6].targetKcal).toBe(2711);
      expect(week.averageTargetKcal).toBe(2436); // (2161 + 2711) / 2
    });

    it('a day whose entries were all removed counts as not logged', async () => {
      const day = await quickAddOn(TODAY, 500);
      await gql(DELETE_LOG_ENTRY, { id: day.entries[0].id }).expect(200);

      const week = (await gql(WEEK).expect(200)).body.data.week;

      expect(week.days[6].logged).toBe(false);
      expect(week.loggedDays).toBe(0);
    });

    it('can show an earlier week, but not one ending in the future', async () => {
      const earlier = (await gql(WEEK, { endDate: addDays(TODAY, -7) }).expect(200)).body.data.week;
      const future = await gql(WEEK, { endDate: addDays(TODAY, 1) }).expect(200);

      expect(earlier.startDate).toBe(addDays(TODAY, -13));
      expect(earlier.endDate).toBe(addDays(TODAY, -7));
      expect(future.body.errors[0].message).toBe("You can't log a day in the future");
    });
  });

  describe('privacy', () => {
    beforeEach(async () => {
      await resetFoods();
      await gql(SAVE_PROFILE, { input: PROFILE_INPUT }).expect(200);
    });

    it('logged out, every query and change is refused, and nothing is saved', async () => {
      const operations: [string, Record<string, unknown>?][] = [
        [PROFILE],
        [SAVE_PROFILE, { input: PROFILE_INPUT }],
        [FOODS],
        [CREATE_FOOD, { input: ROTI_CANAI }],
        [DAILY_LOG],
        [QUICK_ADD, { input: { kcal: 100 } }],
        [WEEK],
        [RECENT_FOODS],
        [ME],
      ];

      for (const [query, variables] of operations) {
        const res = await gqlAs([], query, variables).expect(200);
        expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
      }
      expect(await foodsRepository.countBy({ ownerId: userId })).toBe(0);
    });

    it("another user can't see, change, delete or log your foods", async () => {
      const roti = await ownFood();

      const list = await gqlAs(otherCookie, FOODS).expect(200);
      const edit = await gqlAs(otherCookie, UPDATE_FOOD, { id: roti.id, input: { kcalPerServing: 1 } }).expect(200);
      const remove = await gqlAs(otherCookie, DELETE_FOOD, { id: roti.id }).expect(200);
      const log = await gqlAs(otherCookie, ADD_LOG_ENTRY, { input: { foodId: roti.id, quantity: 1 } }).expect(200);

      expect(list.body.data.foods.map((f: { name: string }) => f.name)).not.toContain('Roti canai');
      // "not found", the same as a wrong id: it doesn't even say the food exists
      for (const res of [edit, remove, log]) {
        expect(res.body.errors[0].message).toBe(`Food ${roti.id} not found`);
      }
      expect((await foodsRepository.findOneByOrFail({ id: roti.id })).kcalPerServing).toBe(300); // unchanged
    });

    it("another user can't see, change or remove your log entries", async () => {
      const day = (await gql(ADD_LOG_ENTRY, { input: { foodId: await idOf('Egg'), quantity: 2 } }).expect(200)).body.data.addLogEntry;
      const entryId = day.entries[0].id;
      await gqlAs(otherCookie, SAVE_PROFILE, { input: PROFILE_INPUT }).expect(200);

      const theirDay = await gqlAs(otherCookie, DAILY_LOG).expect(200);
      const edit = await gqlAs(otherCookie, UPDATE_LOG_ENTRY, { id: entryId, input: { quantity: 9 } }).expect(200);
      const remove = await gqlAs(otherCookie, DELETE_LOG_ENTRY, { id: entryId }).expect(200);

      expect(theirDay.body.data.dailyLog.entries).toEqual([]);
      expect(edit.body.errors[0].message).toBe(`Entry ${entryId} not found`);
      expect(remove.body.errors[0].message).toBe(`Entry ${entryId} not found`);
      expect((await logEntriesRepository.findOneByOrFail({ id: entryId })).quantity).toBe(2); // unchanged
    });

    it('each user has their own profile and history', async () => {
      await gql(QUICK_ADD, { input: { kcal: 500 } }).expect(200);
      await profilesRepository.delete({ userId: (await usersRepository.findOneByOrFail({ email: OTHER_USER.email })).id });

      const theirProfile = await gqlAs(otherCookie, PROFILE).expect(200);
      expect(theirProfile.body.data.profile).toBeNull(); // TEST_USER has one; OTHER_USER doesn't

      await gqlAs(otherCookie, SAVE_PROFILE, { input: PROFILE_INPUT }).expect(200);
      const theirWeek = await gqlAs(otherCookie, WEEK).expect(200);
      expect(theirWeek.body.data.week.loggedDays).toBe(0); // TEST_USER's 500 kcal isn't theirs
    });

    it('both users see the same shared starter foods', async () => {
      const mine = await gql(FOODS).expect(200);
      const theirs = await gqlAs(otherCookie, FOODS).expect(200);

      expect(mine.body.data.foods.map((f: { id: number }) => f.id)).toEqual(theirs.body.data.foods.map((f: { id: number }) => f.id));
    });
  });

  // Last in the file on purpose: each test starts by deleting every user (and so all their data).
  describe('accounts', () => {
    // A different person per test, so one test's wrong passwords can't lock another test out
    const person = (n: number) => ({ name: `Person ${n}`, email: `person${n}@test.com`, password: `password-${n}-long` });

    const register = async (input: { name: string; email: string; password: string }) => {
      const res = await gqlAs([], REGISTER, { input }).expect(200);
      expect(res.body.errors).toBeUndefined();
      return { user: res.body.data.register, cookie: cookieFrom(res) };
    };

    // Only email and password: LoginInput has no name, and GraphQL refuses fields it doesn't know
    const login = ({ email, password }: { email: string; password: string }) =>
      gqlAs([], LOGIN, { input: { email, password } }).expect(200);

    // No users at all, so no "user from before accounts" for a sign-up to take over by accident
    beforeEach(async () => {
      await usersRepository.createQueryBuilder().delete().execute();
    });

    it('signing up makes an account and logs you in, with a 30-day httpOnly cookie', async () => {
      const { user, cookie: session } = await register({ ...person(1), email: '  Person1@Test.com ' });

      expect(user).toMatchObject({ name: 'Person 1', email: 'person1@test.com' }); // trimmed, lower case
      const setCookie = session.join('; ');
      expect(setCookie).toContain('token=');
      expect(setCookie).toContain('HttpOnly'); // JavaScript in the page can't read it
      expect(setCookie).toContain('SameSite=Lax'); // not sent along on requests from other sites
      expect(setCookie).toContain('Max-Age=2592000'); // 30 days, in seconds

      const me = await gqlAs(session, ME).expect(200);
      expect(me.body.data.me).toEqual(user);
    });

    it('stores the password only as an argon2 hash, and never sends it', async () => {
      const { user } = await register(person(2));

      const saved = await usersRepository.findOneByOrFail({ id: user.id });
      expect(saved.passwordHash).toMatch(/^\$argon2/);
      expect(saved.passwordHash).not.toContain(person(2).password);

      const asked = await gqlAs([], `query { me { passwordHash } }`).expect(400); // not even in the schema
      expect(asked.body.errors[0].extensions.code).toBe('GRAPHQL_VALIDATION_FAILED');
    });

    it('refuses an email that is already used, whatever its capitals', async () => {
      await register(person(3));

      const res = await gqlAs([], REGISTER, { input: { ...person(3), email: 'PERSON3@test.com' } }).expect(200);

      expect(res.body.errors[0].message).toBe('Email is already registered');
    });

    it('refuses a short password, a bad email and an empty name', async () => {
      const short = await gqlAs([], REGISTER, { input: { ...person(4), password: 'short' } }).expect(200);
      const badEmail = await gqlAs([], REGISTER, { input: { ...person(4), email: 'not-an-email' } }).expect(200);
      const noName = await gqlAs([], REGISTER, { input: { ...person(4), name: '   ' } }).expect(200);

      expect(short.body.errors).toBeDefined();
      expect(badEmail.body.errors).toBeDefined();
      expect(noName.body.errors).toBeDefined();
      expect(await usersRepository.count()).toBe(0); // and nothing was saved
    });

    it('logs in with the right password', async () => {
      const { user } = await register(person(5));

      const res = await login(person(5));

      expect(res.body.errors).toBeUndefined();
      const me = await gqlAs(cookieFrom(res), ME).expect(200);
      expect(me.body.data.me.id).toBe(user.id);
    });

    it('a wrong password and an unknown email get the same message', async () => {
      await register(person(6));

      const wrongPassword = await login({ email: person(6).email, password: 'not-my-password' });
      const unknownEmail = await login({ email: 'nobody@test.com', password: 'whatever-it-is' });

      // The same words, so the message never says whether an email has an account
      expect(wrongPassword.body.errors[0].message).toBe('Invalid email or password');
      expect(unknownEmail.body.errors[0].message).toBe('Invalid email or password');
    });

    it('after 3 wrong passwords, even the right one is refused for a minute', async () => {
      await register(person(7));
      for (let i = 0; i < 3; i++) {
        await login({ email: person(7).email, password: 'wrong-password' });
      }

      const res = await login(person(7)); // the RIGHT password, but too soon

      expect(res.body.errors[0].message).toBe('Too many wrong passwords. Try again in a minute.');
    });

    it('me needs a valid login cookie', async () => {
      const none = await gqlAs([], ME).expect(200);
      const madeUp = await gqlAs(['token=not-a-real-token'], ME).expect(200);

      expect(none.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
      expect(madeUp.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });

    // supertest isn't a browser and won't delete the cookie itself, so we check the instruction the
    // server sends: "token is now empty and expired in 1970" (same check as the task board)
    it('logout tells the browser to delete the cookie', async () => {
      const { cookie: session } = await register(person(8));

      const res = await gqlAs(session, `mutation { logout }`).expect(200);

      expect(res.body.data.logout).toBe(true);
      const setCookie = String(res.headers['set-cookie']);
      expect(setCookie).toContain('token=;');
      expect(setCookie).toContain('Expires=Thu, 01 Jan 1970');
      expect(setCookie).toContain('HttpOnly'); // same options as login, or browsers won't clear it
    });

    it('changing the password: the old password and old logins stop working, the new ones work', async () => {
      const { cookie: oldSession } = await register(person(9));

      const wrong = await gqlAs(oldSession, CHANGE_PASSWORD, {
        input: { currentPassword: 'not-my-password', newPassword: 'brand-new-password' },
      }).expect(200);
      // BAD_REQUEST, not UNAUTHENTICATED: the app treats UNAUTHENTICATED as "logged out"
      expect(wrong.body.errors[0].extensions.code).toBe('BAD_REQUEST');

      const changed = await gqlAs(oldSession, CHANGE_PASSWORD, {
        input: { currentPassword: person(9).password, newPassword: 'brand-new-password' },
      }).expect(200);
      expect(changed.body.errors).toBeUndefined();

      const oldCookie = await gqlAs(oldSession, ME).expect(200);
      expect(oldCookie.body.errors[0].extensions.code).toBe('UNAUTHENTICATED'); // other devices are logged out
      const newCookie = await gqlAs(cookieFrom(changed), ME).expect(200);
      expect(newCookie.body.errors).toBeUndefined(); // this device stays logged in

      expect((await login(person(9))).body.errors[0].message).toBe('Invalid email or password');
      expect((await login({ email: person(9).email, password: 'brand-new-password' })).body.errors).toBeUndefined();
    });

    it('the first sign-up takes over the data from before accounts; later sign-ups start empty', async () => {
      // The one user from before accounts: no email, with a food of its own
      const legacy = await usersRepository.save(usersRepository.create({}));
      await foodsRepository.save({ ...ROTI_CANAI, ownerId: legacy.id });

      const first = await register(person(10));
      const second = await register(person(11));

      expect(first.user.id).toBe(legacy.id); // the same user, now with an email and password
      expect(await foodsRepository.countBy({ ownerId: legacy.id })).toBe(1); // its data is still there
      expect(second.user.id).not.toBe(legacy.id); // a new, empty account
      expect(await foodsRepository.countBy({ ownerId: second.user.id })).toBe(0);
    });
  });
});
