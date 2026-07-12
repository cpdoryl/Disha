import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor());

  // API versioning
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Disha - Adaptive School Diagnostic Engine')
    .setDescription('Challenge-first assessment and gap prediction API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Health check endpoint
  app.get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║         🎓 Disha API Server Started                       ║
    ║         Environment: ${(process.env.NODE_ENV || 'development').padEnd(38)}║
    ║         Port: ${port.toString().padEnd(50)}║
    ║         API: http://localhost:${port}/api/v1${' '.repeat(31 - port.toString().length)}║
    ║         Docs: http://localhost:${port}/docs${' '.repeat(30 - port.toString().length)}║
    ║         Status: http://localhost:${port}/health${' '.repeat(28 - port.toString().length)}║
    ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
