import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { TopupModule } from './modules/topup/topup.module';
import { UsersModule } from './modules/users/users.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { RequestIdMiddleware } from './middlewares/request-id.middleware';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: '',
      expandVariables: true,
    }),
    SharedModule,
    UsersModule,
    TopupModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
