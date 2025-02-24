import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { LockService } from './lock.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [LockService],
  exports: [LockService],
})
export class LockModule {}
