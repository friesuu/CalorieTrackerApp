import { INestApplication, ValidationPipe } from '@nestjs/common';

// No CORS here: in development the frontend reaches the API through Vite's proxy,
// so the browser sees both on the same address (see frontend/vite.config.js).
export function setupApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
