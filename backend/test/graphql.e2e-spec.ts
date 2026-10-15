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
import { todayIn } from '../src/common/dates';

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
});
