import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest'; // default import: no braces
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module'; // ../ = go up one folder
import { setupApp } from '../src/app.setup';
import { Food } from '../src/foods/food.entity';
import { BASIC_FOODS } from '../src/foods/basic-foods';
import { Profile } from '../src/profiles/profile.entity';
import { DailyLog } from '../src/daily-logs/daily-log.entity';
import { LogEntry } from '../src/daily-logs/log-entry.entity';
import { addDays, todayIn } from '../src/common/dates';

// Each operation is written once and reused. $name = a variable sent separately.
const ME = `
  query {
    me { id timezone }
  }
`;

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

const FOOD_FIELDS = 'id name servingSize servingUnit kcalPerServing proteinG carbsG fatG';

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

const DELETE_FOOD = `
  mutation DeleteFood($id: Int!) {
    deleteFood(id: $id)
  }
`;

const ROTI_CANAI = { name: 'Roti canai', servingSize: 1, servingUnit: 'piece', kcalPerServing: 300 };

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
  let foodsRepository: Repository<Food>;
  let profilesRepository: Repository<Profile>;
  let dailyLogsRepository: Repository<DailyLog>;
  let logEntriesRepository: Repository<LogEntry>;
  let userId: number; // the one user's id, found in beforeAll

  // Runs ONCE before all tests: build and start the app, and bring the test database's
  // tables up to date by running the same migrations as the real database
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app); // same validation as the real app
    await app.init();

    await app.get(DataSource).runMigrations();
    foodsRepository = app.get(getRepositoryToken(Food));
    profilesRepository = app.get(getRepositoryToken(Profile));
    dailyLogsRepository = app.get(getRepositoryToken(DailyLog));
    logEntriesRepository = app.get(getRepositoryToken(LogEntry));
    userId = (await gql(ME).expect(200)).body.data.me.id; // also makes the user on a fresh test database
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

  // Every GraphQL call is POST /graphql with { query, variables }
  const gql = (query: string, variables?: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/graphql').send({ query, variables });

  // Back to just the basic foods (tests add and delete foods)
  const resetFoods = async () => {
    await foodsRepository.delete({ ownerId: userId });
    await foodsRepository.save(BASIC_FOODS.map((food) => ({ ...food, ownerId: userId })));
  };

  // The id of one of the basic foods, e.g. idOf('Egg')
  const idOf = async (name: string): Promise<number> =>
    (await foodsRepository.findOneByOrFail({ ownerId: userId, name })).id;

  const foodNames = async (): Promise<string[]> => {
    const res = await gql(FOODS).expect(200);
    expect(res.body.errors).toBeUndefined();
    return res.body.data.foods.map((f: { name: string }) => f.name);
  };

  // Error shapes (same as the task board):
  //   rejected by the schema      -> HTTP 400, extensions.code BAD_USER_INPUT
  //   rejected by ValidationPipe  -> HTTP 200, data null, messages in extensions.originalError.message
  //   thrown by the service       -> HTTP 200, data null, message in errors[0].message

  describe('single user', () => {
    it('me returns the one user, in the Kuala Lumpur time zone', async () => {
      const res = await gql(ME).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.me.timezone).toBe('Asia/Kuala_Lumpur');
    });

    it('is the same user on every request', async () => {
      const [a, b] = await Promise.all([gql(ME), gql(ME)]); // arriving together must not make two users

      expect(a.body.data.me.id).toBe(b.body.data.me.id);
    });

    it('starts with the basic foods in their library', async () => {
      const me = (await gql(ME).expect(200)).body.data.me;
      const names = (await foodsRepository.findBy({ ownerId: me.id })).map((f) => f.name);

      expect(names).toEqual(expect.arrayContaining(BASIC_FOODS.map((f) => f.name)));
    });
  });

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
      expect(await profilesRepository.count()).toBe(1);
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
      const me = (await gql(ME).expect(200)).body.data.me;
      await dailyLogsRepository.save([
        { ownerId: me.id, logDate: TODAY, targetKcal: 1800 },
        { ownerId: me.id, logDate: '2026-01-01', targetKcal: 1800 },
      ]);

      await gql(SAVE_PROFILE, { input: PROFILE_INPUT }).expect(200);

      expect((await dailyLogsRepository.findOneByOrFail({ ownerId: me.id, logDate: TODAY })).targetKcal).toBe(2161);
      expect((await dailyLogsRepository.findOneByOrFail({ ownerId: me.id, logDate: '2026-01-01' })).targetKcal).toBe(1800);
    });

    it('rejects anyone under 18', async () => {
      const tenYearsAgo = `${Number(TODAY.slice(0, 4)) - 10}-01-01`;
      const res = await gql(SAVE_PROFILE, { input: { ...PROFILE_INPUT, birthDate: tenYearsAgo } }).expect(200);

      expect(res.body.errors[0].message).toBe('Age must be between 18 and 100');
      expect(await profilesRepository.count()).toBe(0); // and nothing was saved
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

    it('lists the library A to Z', async () => {
      const names = await foodNames();

      expect(names).toEqual(BASIC_FOODS.map((f) => f.name).sort((a, b) => a.localeCompare(b)));
    });

    it('sends macros as null when they are not known', async () => {
      const res = await gql(FOODS).expect(200);

      expect(res.body.data.foods[0].proteinG).toBeNull();
    });

    it('deletes a food', async () => {
      const egg = await foodsRepository.findOneByOrFail({ ownerId: userId, name: 'Egg' });

      const res = await gql(DELETE_FOOD, { id: egg.id }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.deleteFood).toBe(true);
      expect(await foodNames()).not.toContain('Egg');
    });

    it('deleting a food keeps the days it was logged on', async () => {
      const egg = await foodsRepository.findOneByOrFail({ ownerId: userId, name: 'Egg' });
      const day = await dailyLogsRepository.save({ ownerId: userId, logDate: '2026-01-01', targetKcal: 1800 });
      const entry = await logEntriesRepository.save({
        dailyLogId: day.id, foodId: egg.id, name: 'Egg', servingSize: 1, servingUnit: 'large', kcalPerServing: 72, quantity: 2,
      });

      await gql(DELETE_FOOD, { id: egg.id }).expect(200);

      const kept = await logEntriesRepository.findOneByOrFail({ id: entry.id });
      expect(kept.foodId).toBeNull(); // no longer linked to the library...
      expect(kept.name).toBe('Egg'); // ...but still says what you ate
      expect(kept.kcalPerServing).toBe(72);
    });

    it('says which food was not found', async () => {
      const res = await gql(DELETE_FOOD, { id: 999999 }).expect(200);

      expect(res.body.errors[0].message).toBe('Food 999999 not found');
    });
  });

  // YOUR TURN (step 4): these pass once createFood works end to end on the backend
  describe('createFood', () => {
    beforeEach(resetFoods);

    it('adds a food to the library', async () => {
      const res = await gql(CREATE_FOOD, { input: ROTI_CANAI }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.createFood).toMatchObject({ ...ROTI_CANAI, proteinG: null, carbsG: null, fatG: null });
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

    it('rejects a name that is already in the library', async () => {
      const res = await gql(CREATE_FOOD, { input: { ...ROTI_CANAI, name: 'Egg' } }).expect(200);

      expect(res.body.errors[0].message).toBe('You already have a food called "Egg"');
    });
  });

  describe('updateFood', () => {
    beforeEach(resetFoods);

    it('changes only what is sent', async () => {
      const res = await gql(UPDATE_FOOD, { id: await idOf('Egg'), input: { kcalPerServing: 78, proteinG: 6.3 } }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateFood).toMatchObject({ name: 'Egg', servingUnit: 'large', kcalPerServing: 78, proteinG: 6.3 });
    });

    it('can clear the serving size and unit', async () => {
      const res = await gql(UPDATE_FOOD, { id: await idOf('Egg'), input: { servingSize: null, servingUnit: null } }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateFood).toMatchObject({ servingSize: null, servingUnit: null });
    });

    it("can keep its own name, but not take another food's", async () => {
      const id = await idOf('Egg');

      const same = await gql(UPDATE_FOOD, { id, input: { name: 'Egg' } }).expect(200);
      expect(same.body.errors).toBeUndefined();

      const taken = await gql(UPDATE_FOOD, { id, input: { name: 'Banana' } }).expect(200);
      expect(taken.body.errors[0].message).toBe('You already have a food called "Banana"');
    });

    it('refuses to empty the name or calories', async () => {
      const res = await gql(UPDATE_FOOD, { id: await idOf('Egg'), input: { name: null } }).expect(200);

      expect(res.body.errors[0].message).toBe('Name and calories cannot be empty');
    });

    it('says which food was not found', async () => {
      const res = await gql(UPDATE_FOOD, { id: 999999, input: { kcalPerServing: 1 } }).expect(200);

      expect(res.body.errors[0].message).toBe('Food 999999 not found');
    });
  });

  describe('daily log', () => {
    const YESTERDAY = addDays(TODAY, -1);

    // Every test starts with the basic foods and the 2,161 kcal profile (see PROFILE_INPUT)
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

    it('adds a food, copying its details, and returns the new totals', async () => {
      const day = await addEntry({ foodId: await idOf('Egg'), quantity: 2 });

      expect(day.entries).toEqual([
        expect.objectContaining({ name: 'Egg', servingSize: 1, servingUnit: 'large', kcalPerServing: 72, quantity: 2, kcal: 144 }),
      ]);
      expect(day.eatenKcal).toBe(144);
      expect(day.remainingKcal).toBe(2161 - 144);
    });

    it('rounds each entry to whole calories, and the total adds up the rounded rows', async () => {
      // 1.5 × 105 = 157.5 → 158, twice = 316
      await addEntry({ foodId: await idOf('Banana'), quantity: 1.5 });
      const day = await addEntry({ foodId: await idOf('Banana'), quantity: 1.5 });

      expect(day.entries.map((e: { kcal: number }) => e.kcal)).toEqual([158, 158]);
      expect(day.eatenKcal).toBe(316);
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
      const egg = await idOf('Egg');
      await addEntry({ foodId: egg, quantity: 1 });

      await gql(UPDATE_FOOD, { id: egg, input: { kcalPerServing: 90 } }).expect(200);

      const day = (await gql(DAILY_LOG).expect(200)).body.data.dailyLog;
      expect(day.entries[0].kcalPerServing).toBe(72);
    });

    it('adds up macros from the entries that have them, null when none do', async () => {
      const egg = await idOf('Egg');
      await gql(UPDATE_FOOD, { id: egg, input: { proteinG: 6.3 } }).expect(200);

      await addEntry({ foodId: egg, quantity: 2 });
      const day = await addEntry({ foodId: await idOf('Apple'), quantity: 1 }); // no macros known

      expect(day.proteinG).toBe(12.6);
      expect(day.fatG).toBeNull();
    });

    it('recent foods: newest first, each food once, deleted foods left out', async () => {
      await addEntry({ foodId: await idOf('Egg'), quantity: 1 });
      await addEntry({ foodId: await idOf('Banana'), quantity: 1 });
      await addEntry({ foodId: await idOf('Egg'), quantity: 1 });
      await addEntry({ foodId: await idOf('Apple'), quantity: 1 });
      await gql(QUICK_ADD, { input: { kcal: 100 } }).expect(200); // not a library food: never "recent"
      await gql(DELETE_FOOD, { id: await idOf('Apple') }).expect(200);

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
    // The basic foods and the 2,161 kcal profile, like the daily log tests
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
});
