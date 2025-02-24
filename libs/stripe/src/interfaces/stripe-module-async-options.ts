import { StripeModuleOptions } from './stripe-module-options';

export interface StripeModuleAsyncOptions {
  isGlobal?: boolean;
  useFactory: (
    ...args: any[]
  ) => Promise<StripeModuleOptions> | StripeModuleOptions;
  inject?: any[];
}
