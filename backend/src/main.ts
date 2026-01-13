import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser to use custom
  });

  // Increase body size limit to 50MB for image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  app.enableCors({
    origin: process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',')
      : ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false, // Allow extra fields but strip them
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => 
          Object.values(error.constraints || {}).join(', ')
        );
        return new HttpException(
          { message: messages.join('; ') || 'Validation failed' },
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3002;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}/api`);

  // Create admin account on startup (after server is ready)
  try {
    const authService = app.get(AuthService);
    await authService.ensureAdminExists();
  } catch (error) {
    console.error('⚠️  Warning: Could not create admin account:', error.message);
    console.log('   You can create admin manually or restart after database is ready');
  }
}
bootstrap();
