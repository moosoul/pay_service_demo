import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { StripeModule } from '@libs/stripe';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { InjectRedis, RedisModule } from '@nestjs-modules/ioredis';
import { LockModule } from './lock/lock.module';
import { PrismaService } from './prisma/prisma.service';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [
    PrismaModule,
    StripeModule.forRootAsync({
      useFactory(configService: ConfigService) {
        return {
          publishableKey: configService.get('STRIPE_PUBLISHABLE_KEY'),
          secretKey: configService.get('STRIPE_SECRET_KEY'),
          apiVersion: configService.get('STRIPE_API_VERSION'),
        };
      },
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      useFactory(configService: ConfigService) {
        return {
          url: configService.get('REDIS_URL'),
          type: 'single',
        };
      },
      inject: [ConfigService],
    }),
    LockModule,
    UsersModule,
    AuthModule,
  ],
  exports: [
    PrismaModule,
    StripeModule,
    RedisModule,
    LockModule,
    UsersModule,
    AuthModule,
  ],
})
export class SharedModule implements OnModuleDestroy {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    await this.redis.quit();
  }
}
