import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest'; // default import: no braces
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../src/app.module'; // ../ = go up one folder
import { setupApp } from '../src/app.setup';
import { Food } from '../src/foods/food.entity';
import { BASIC_FOODS } from '../src/foods/basic-foods';

// Each operation is written once and reused. $name = a variable sent separately.
const ME = `
  query {
    me { id timezone }
  }
`;

describe('Calorie tracker GraphQL API (e2e)', () => {
  let app: INestApplication; // set in beforeAll, used by every test
  let foodsRepository: Repository<Food>;

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
});
