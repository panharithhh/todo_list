import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Enable cookie parser middleware
  app.use(cookieParser());

  // Enable CORS with credentials support for cookies.
  // Only explicitly allowlisted origins may send credentialed requests.
  const allowedOrigins = config
    .get<string>('CORS_ORIGIN', 'http://localhost:5180')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Enable global validation pipe with class-validator & class-transformer
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}
await bootstrap();
