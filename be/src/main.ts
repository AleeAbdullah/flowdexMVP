import './infrastructure/config/load-env';
import 'reflect-metadata';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { assertRequiredEnv, env } from './infrastructure/config/env';

async function bootstrap(): Promise<void> {
  assertRequiredEnv();
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.enableCors({
    origin: [
      `https://${env.appDomain}`,
      `https://www.${env.appDomain}`,
      ...(process.env.NODE_ENV === 'production'
        ? []
        : ['http://localhost:3003', 'http://127.0.0.1:3003']),
    ],
  });

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
      .setDescription('Backend API for Alchemy-managed wallets, transaction ledgering, and analytics')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build(),
  );

  SwaggerModule.setup(env.swaggerPath, app, document);

  await app.listen(env.port);
}

bootstrap();
