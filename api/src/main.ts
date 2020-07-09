import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Keys } from './constants/keys';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

declare const module: any;

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const app = await NestFactory.create(AppModule);

  //setup swagger
  const options = new DocumentBuilder()
    .setTitle('FloodRunner')
    .setDescription('The FloodRunner API')
    .setVersion('1.0')
    .addTag('floodrunner')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  //setup cors
  app.enableCors();

  await app.listen(Keys.serverPort);
  logger.debug(`Application is running on: ${await app.getUrl()}`);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
