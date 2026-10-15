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
});
