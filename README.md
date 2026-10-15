# Calorie Tracker
A calorie tracker for logging what you eat, made for a phone first but works on a laptop too. It works out a daily calorie target from your profile and shows how much you have left today.

- Frontend: React (Vite)
- Backend: NestJS
- API: GraphQL (Apollo Server)
- Database: PostgreSQL (TypeORM, with migrations)

## Status
Built step by step. Each step works on its own before the next one starts.

1. Scaffold: backend, frontend, theme and navigation (done)
2. Database tables: entities and the first migration (in progress)
3. Profile and calorie target
4. Food library
5. Daily log
6. Drag and drop
7. Weekly history
8. Loading/error states, tests and the full README

## How to run it
You need **Node.js** and **PostgreSQL** installed.

**1. Create the databases**

In pgAdmin, open the Query Tool and run these SQL queries one at a time:

CREATE DATABASE calorietracker;

CREATE DATABASE calorietracker_test;

**2. Start the backend**

cd backend
npm install

Copy `.env.example` to a new file called `.env`, and put your PostgreSQL password in it. Then, in the same terminal:

npm run migration:run
npm run start:dev

The API is at http://localhost:3001/graphql (open it in the browser to try queries).

**3. Start the frontend** (in a new terminal)

cd frontend
npm install
npm run dev

Open http://localhost:5174. To use it on your phone, connect to the same Wi-Fi and open the **Network** address Vite prints.

- The ports are 3001 and 5174 (not 3000 and 5173) so this can run at the same time as the task board.
- If **npm** doesn't work, use **npm.cmd** instead.

## Running the tests
cd into the `backend` folder and run:

npm run test:e2e

They use the `calorietracker_test` database, so they don't touch your real data.
