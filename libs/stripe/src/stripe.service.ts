import { Inject, Injectable } from '@nestjs/common';
import { StripeModuleOptions } from './interfaces/stripe-module-options';
import { STRIPE_CONFIG_OPTIONS } from './constants/stripe.constants';
import Stripe from 'stripe';

@Injectable()
export class StripeService extends Stripe {
  constructor(
    @Inject(STRIPE_CONFIG_OPTIONS)
    private readonly options: StripeModuleOptions,
  ) {
    if (!options.publishableKey) {
      throw new Error(
        'The Stripe PublishableKey is required, Please check your .env file STRIPE_PUBLISHABLE_KEY.',
      );
    }
    if (!options.secretKey) {
      throw new Error(
        'The Stripe SecretKey is required, Please check your .env file STRIPE_SECRET_KEY.',
      );
    }
    super(options.secretKey, {
      apiVersion: (options.apiVersion as any) || '2025-01-27.acacia',
      typescript: true,
    });
  }

  get publishableKey() {
    return this.options.publishableKey;
  }
}
