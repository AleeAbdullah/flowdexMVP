import 'dotenv/config';
import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { assertRequiredEnv, env } from './infrastructure/config/env';

async function bootstrap(): Promise<void> {
  assertRequiredEnv();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(env.apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('FlowDex Backend API')
      .setDescription('Backend MVP API for the FlowDex presale platform')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build(),
  );

  SwaggerModule.setup(env.swaggerPath, app, document);

  await app.listen(env.port);
}

bootstrap();
