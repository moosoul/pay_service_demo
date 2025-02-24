import { Module } from '@nestjs/common';
import { WebhooksStripeModule } from './stripe/webhooks-stripe.module';

@Module({
  imports: [WebhooksStripeModule],
})
export class WebhooksModule {}
