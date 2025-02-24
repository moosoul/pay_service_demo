import { Module } from '@nestjs/common';
import { WebhooksStripeController } from './webhooks-stripe.controller';
import { WebhooksStripeService } from './webhooks-stripe.service';

@Module({
  controllers: [WebhooksStripeController],
  providers: [WebhooksStripeService],
})
export class WebhooksStripeModule {}
