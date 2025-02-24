import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';
import { STRIPE_CONFIG_OPTIONS } from './constants/stripe.constants';

describe('StripeService', () => {
  let service: StripeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: STRIPE_CONFIG_OPTIONS,
          useValue: {
            publishableKey: 'test',
            secretKey: 'test',
          },
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
