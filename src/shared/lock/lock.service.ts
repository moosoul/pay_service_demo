import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class LockService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async acquire(
    lockKey: string,
    lockValue: string | number,
    expriesMs: number,
  ) {
    const reuslt = await this.redis.set(lockKey, lockValue, 'EX', expriesMs);
    return reuslt === 'OK';
  }

  async release(lockKey: string) {
    await this.redis.del(lockKey);
  }
}
