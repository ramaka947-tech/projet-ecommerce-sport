import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Adresses du frontend autorisées (séparées par des virgules dans FRONTEND_URL).
  // Les espaces et les slashs finaux sont retirés pour éviter les erreurs CORS.
  const allowedOrigins = (
    process.env.FRONTEND_URL ??
    'http://localhost:3001,https://projet-ecommerce-sport-63a1.vercel.app'
  )
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();