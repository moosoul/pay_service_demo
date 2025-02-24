import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { WebhooksStripeService } from './webhooks-stripe.service';
import type { Request } from 'express';
import { ApiOperation } from '@nestjs/swagger';

@Controller('webhooks/stripe')
export class WebhooksStripeController {
  constructor(private readonly service: WebhooksStripeService) {}

  @ApiOperation({ summary: 'Stripe Webhook' })
  @Post()
  async handleWebhook() {
    await this.service.handleWebhook();
    return 'success';
  }

  @Get('success')
  async success(@Req() req: Request) {
    console.log(req.headers);
    console.log(req.body);
    console.log(req.query);
    return 'success';
  }
}
