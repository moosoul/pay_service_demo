import { Test } from '@nestjs/testing';
import { StripeModule } from './stripe.module';
import { StripeService } from './stripe.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('StripeModule', () => {
  describe('forRoot', () => {
    it('should provide StripeService', async () => {
      const module = await Test.createTestingModule({
        imports: [
          StripeModule.forRoot({
            publishableKey: 'test',
            secretKey: 'test',
          }),
        ],
      }).compile();

      const service = module.get<StripeService>(StripeService);
      expect(service).toBeDefined();
    });
  });

  describe('forRootAsync', () => {
    it('should throw error when config is missing', async () => {
      await expect(
        Test.createTestingModule({
          imports: [
            ConfigModule.forRoot(),
            StripeModule.forRootAsync({
              inject: [ConfigService],
              useFactory: (config: ConfigService) => ({
                publishableKey: config.get('stripe.publishableKey'),
                secretKey: config.get('stripe.secretKey'),
              }),
            }),
          ],
        }).compile(),
      ).rejects.toThrow();
    });

    it('should provide StripeService using useFactory', async () => {
      const module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            load: [
              () => ({
                stripe: {
                  publishableKey: 'pk_test_mock',
                  secretKey: 'sk_test_mock',
                },
              }),
            ],
          }),
          StripeModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              publishableKey: config.get('stripe.publishableKey'),
              secretKey: config.get('stripe.secretKey'),
            }),
          }),
        ],
      }).compile();

      const service = module.get<StripeService>(StripeService);
      expect(service).toBeDefined();
    });
  });
});
