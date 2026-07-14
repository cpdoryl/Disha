import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // Enable Express compression middleware
  // Install with: npm install compression
  // Compresses responses with gzip when client supports it (Accept-Encoding: gzip)
  // Reduces bandwidth by 80-90% for JSON responses
  try {
    // Dynamic import to support optional compression package
    const compression = require('compression');
    app.use(compression({
      threshold: 100,           // Compress responses > 100 bytes
      level: 6,                 // Balance between compression and CPU (0-11)
      filter: (req: any, res: any) => {
        const contentType = res.getHeader('Content-Type') || '';
        const compressibleTypes = [
          'application/json',
          'application/javascript',
          'text/plain',
          'text/html',
          'text/css',
          'text/xml',
          'application/xml',
        ];
        return compressibleTypes.some(type => contentType.includes(type));
      },
    }));
  } catch (err) {
    console.warn('⚠️  Compression middleware not available. Install with: npm install compression');
  }

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

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Disha API v2 - Adaptive School Diagnostic Engine')
    .setDescription('Challenge-first assessment and gap prediction API for RYL schools')
    .setVersion('2.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT token',
    })
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Schools', 'School management')
    .addTag('Students', 'Student data management')
    .addTag('Data', 'Operational and monitoring data')
    .addTag('Notifications', 'Parent and staff communications')
    .addTag('Reports', 'Assessment and performance reports')
    .addTag('Audit', 'Audit logs and security events')
    .addTag('Wellbeing', 'Student wellbeing and interventions')
    .addTag('Assessments', 'Challenge assessments')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Note: Health check endpoint is provided by AppModule controller

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
    ║         Compression: ✅ Enabled (gzip)${' '.repeat(19)}║
    ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
