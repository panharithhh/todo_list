import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  // 👈 Removed the { instrument: ObserveInstrument }
  const app = await NestFactory.create(AppModule);

  // 👈 Enable CORS for frontend
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
