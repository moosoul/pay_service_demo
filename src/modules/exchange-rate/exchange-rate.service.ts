import { Injectable } from '@nestjs/common';

const rates = [
  {
    from: 'USD',
    to: 'HKD',
    rate: 8,
  },
  {
    from: 'USD',
    to: 'CNY',
    rate: 7,
  },
  {
    from: 'CNY',
    to: 'HKD',
    rate: 0.8,
  },
  {
    from: 'CNY',
    to: 'USD',
    rate: 0.1428,
  },
  {
    from: 'HKD',
    to: 'CNY',
    rate: 1.25,
  },
  {
    from: 'HKD',
    to: 'USD',
    rate: 0.128,
  },
];

@Injectable()
export class ExchangeRateService {
  /**
   * 汇率转换
   *
   * 模拟汇率，如果生产需要调用汇率相关的API，存储到Redis或者数据库中
   * @param from 源货币
   * @param to 目标货币
   * @returns 汇率
   */
  async exchange(from: string, to: string) {
    from = from.toUpperCase();
    to = to.toUpperCase();

    if (from === to) {
      return 1;
    }
    const rate = rates.find((item) => item.from === from && item.to === to);
    if (!rate) {
      throw new Error('Rate not found');
    }
    return rate.rate;
  }
}
