import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpResponseInterceptor } from './interceptors/http-response.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new HttpResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Pay Service')
    .setDescription('Pay Service API description')
    .setVersion('1.0')
    .addTag('pay')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('openapi', app, documentFactory);

  const PORT = configService.get<number>('PORT');

  app.setGlobalPrefix('api', {
    exclude: ['/openapi'],
  });
  const server = await app.listen(PORT || 3000);

  console.log(
    `The Pay Service Server is running on port http://localhost:${PORT}`,
  );
}
bootstrap();
