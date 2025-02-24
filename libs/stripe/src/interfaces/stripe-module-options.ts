export interface StripeModuleOptions {
  secretKey: string;
  publishableKey: string;
  apiVersion?: string;
  isGlobal?: boolean;

  // webhookConfig?: {
  //   secret: string;
  //   requestBodyProperty?: string;
  //   controllerPrefix?: string;
  //   decorators?: ClassDecorator[];
  //   loggingConfiguration?: {
  //     logMatchingEventHandlers: boolean;
  //   };
  // };
}
