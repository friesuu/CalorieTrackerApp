import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

// No CORS here: in development the frontend reaches the API through Vite's proxy,
// so the browser sees both on the same address (see frontend/vite.config.js).
// That also means the login cookie is a same-site cookie, which SameSite=Lax allows.
export function setupApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(cookieParser()); // fills req.cookies, so the auth guard can read the login cookie
}
