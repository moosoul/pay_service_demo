import { DynamicModule, Module, Provider } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeModuleOptions } from './interfaces/stripe-module-options';
import { STRIPE_CONFIG_OPTIONS } from './constants/stripe.constants';
import { StripeModuleAsyncOptions } from './interfaces/stripe-module-async-options';

@Module({
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {
  private static createDynamicModule(
    providers: Provider[],
    isGlobal = false,
  ): DynamicModule {
    return {
      module: StripeModule,
      global: isGlobal,
      providers: [...providers],
      exports: [StripeService],
    };
  }

  static forRoot(options: StripeModuleOptions): DynamicModule {
    const providers = [
      {
        provide: STRIPE_CONFIG_OPTIONS,
        useValue: options,
      },
      StripeService,
    ];

    return this.createDynamicModule(providers, options.isGlobal);
  }

  static forRootAsync(options: StripeModuleAsyncOptions): DynamicModule {
    const providers = [
      {
        provide: STRIPE_CONFIG_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      StripeService,
    ];

    return this.createDynamicModule(providers, options.isGlobal);
  }
}
