import { StripeService } from '@libs/stripe';
import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  Scope,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { Request } from '@/interfaces/request';
import Stripe from 'stripe';
import { LockService } from '@/shared/lock/lock.service';
import { PrismaService } from '@/shared/prisma/prisma.service';
import {
  Prisma,
  StripePaymentDataType,
  Transaction,
  TransactionStatus,
} from '@prisma/client';

const HANDLE_WEBHOOK_EVENTS = [
  'charge.succeeded',
  'charge.updated',
  'checkout.session.async_payment_failed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.completed',
  'checkout.session.expired',
  'payment_intent.amount_capturable_updated',
  'payment_intent.canceled',
  'payment_intent.created',
  'payment_intent.partially_funded',
  'payment_intent.payment_failed',
  'payment_intent.processing',
  'payment_intent.requires_action',
  'payment_intent.succeeded',
  'refund.updated',
  'refund.failed',
];

@Injectable({ scope: Scope.REQUEST })
export class WebhooksStripeService {
  private logger = new Logger(WebhooksStripeService.name);

  constructor(
    @Inject(REQUEST) private request: Request,
    private readonly lockService: LockService,
    private configService: ConfigService,
    private stripe: StripeService,
    private prisma: PrismaService,
  ) {}
  async handleWebhook() {
    const stripeWebhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeWebhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET is not set');
      throw new HttpException('STRIPE_WEBHOOK_SECRET is not set', 400);
    }
    let event: Stripe.Event = this.request.body;
    if (!event) {
      this.logger.error('Stripe webhook event is not set');
      throw new HttpException('Stripe webhook event is not set', 400);
    }
    console.log('event: ', event.type);

    // 使用redis锁
    const idempotencyKey = event.request?.idempotency_key || `${event.id}`;
    const lockKey = `stripe:webhook:lock:${idempotencyKey}`;
    const lockValue = idempotencyKey;
    const lockExpriesMs = 1000 * 60 * 5; // 5分钟
    const isLockAcquired = await this.lockService.acquire(
      lockKey,
      lockValue,
      lockExpriesMs,
    );
    if (!isLockAcquired) {
      this.logger.warn(`Lock for event ${event.id} already exists`);
      throw new HttpException('Lock already exists', 429);
    }

    const signuature = this.request.headers['stripe-signature'];
    try {
      event = this.stripe.webhooks.constructEvent(
        this.request.rawBody,
        signuature,
        stripeWebhookSecret,
      );
    } catch (err) {
      this.logger.error(err);
      throw new HttpException('Invalid signature', 400);
    }

    if (!HANDLE_WEBHOOK_EVENTS.includes(event.type)) {
      this.logger.warn(`Unhandled event type ${event.type}`);
      return 'ok';
    }

    // 一次性支付的webhook顺序是payment_intent.created -> charge.succeeded -> payment_intent.succeeded -> checkout.session.completed -> charge.updated

    // 处理stripe webhook事件
    const eventDataObject = event.data.object as
      | Stripe.PaymentIntent
      | Stripe.Checkout.Session
      | Stripe.Charge;
    let type: StripePaymentDataType;

    if (event.type.startsWith('checkout.session')) {
      type = StripePaymentDataType.checkout_session;
    } else if (event.type.startsWith('payment_intent')) {
      type = StripePaymentDataType.payment_intent;
    } else if (event.type.startsWith('charge')) {
      type = StripePaymentDataType.charge;
    } else if (event.type.startsWith('refund')) {
      type = StripePaymentDataType.refund;
    }

    const transactionId = eventDataObject.metadata.transactionId;
    if (!transactionId) {
      this.logger.warn(
        `Transaction id not found, Event Id: ${eventDataObject.id}`,
      );
      return;
    }
    const transaction = await this.prisma.transaction.findUnique({
      where: {
        id: transactionId,
      },
    });
    if (!transaction) {
      this.logger.warn(`Transaction not found: ${transactionId}`);
      return;
    }

    console.log('开始处理事件');
    await this.prisma.$transaction(async (tx) => {
      console.log(`事件类型: ${event.type}, 事件创建的事件: ${event.created}`);

      const stripeWebhookEvent = await tx.stripeWebhookEvent.create({
        data: {
          id: event.id,
          type: event.type,
          transactionId: transaction.id,
          metadata: eventDataObject as any,
          created: event.created,
        },
      });
      const stripePaymentData = await tx.stripePaymentData.findUnique({
        where: {
          id_type: {
            id: eventDataObject.id,
            type,
          },
        },
      });
      if (!stripePaymentData) {
        // 不存在时创建对应的stripePaymentData
        await tx.stripePaymentData.create({
          data: {
            id: eventDataObject.id,
            type,
            transactionId: transaction.id,
            responseMetadata: eventDataObject as any,
          },
        });
      }
      const lastUpdated = await tx.stripeWebhookEvent.findFirst({
        where: {
          id: { not: stripeWebhookEvent.id },
        },
        orderBy: { created: 'desc' },
      });

      if (!lastUpdated || lastUpdated.created < event.created) {
        // 基于不同的状态去更新transaction的状态, 需要判断当前event的事件的时间是否大于最后一次stripeWebhookEvent的事件的事件
        await tx.stripePaymentData.upsert({
          where: {
            id_type: {
              id: eventDataObject.id,
              type,
            },
          },
          create: {
            id: eventDataObject.id,
            type,
            transactionId: transaction.id,
            responseMetadata: eventDataObject as any,
          },
          update: {
            responseMetadata: eventDataObject as any,
          },
        });

        // 处理transaction的状态更新
        let status = transaction.status;
        let failedReason = transaction.failedReason;

        if (
          event.type === 'payment_intent.succeeded' ||
          event.type === 'charge.succeeded'
        ) {
          status = 'succeeded';
        } else if (
          event.type === 'payment_intent.payment_failed' ||
          event.type === 'charge.failed'
        ) {
          status = 'failed';
        } else if (event.type === 'checkout.session.expired') {
          status = 'expired';
        } else if (
          event.type === 'refund.failed' ||
          event.type === 'refund.updated'
        ) {
          status = await this.handleRefundEvent(transaction, event, tx);
        }

        await tx.transaction.update({
          where: {
            id: transaction.id,
          },
          data: {
            stripePaymentStatus: event.type,
            status,
          },
        });
      }
    });

    return 'ok';
  }

  private async handleRefundEvent(
    transaction: Transaction,
    event: Stripe.Event,
    tx: Prisma.TransactionClient,
  ): Promise<TransactionStatus> {
    console.log(JSON.stringify(event));
    const eventDataObject = event.data.object as Stripe.Refund;
    const refundId = eventDataObject.metadata['refundId'];
    if (!refundId) {
      this.logger.warn(`Refund id not found, Event Id: ${eventDataObject.id}`);
      return;
    }
    const refund = await tx.transactionRefund.findUnique({
      where: {
        id: refundId,
      },
    });
    if (!refund) {
      this.logger.warn(`Refund not found, Refund Id: ${refundId}`);
      return;
    }

    const charge = await this.stripe.charges.retrieve(
      eventDataObject.charge as string,
    );

    const totalRefundedAmount = charge.amount_refunded;

    let status: TransactionStatus = transaction.status;
    if (totalRefundedAmount === transaction.amount) {
      if (event.type === 'refund.failed') {
        status = 'refund_failed';
      } else if (event.type === 'refund.updated') {
        if (eventDataObject.object === 'refund') {
          if (eventDataObject.status === 'succeeded') {
            status = 'refund_succeeded';
          } else if (eventDataObject.status === 'failed') {
            status = 'refund_failed';
          }
        }
      }
    } else {
      if (event.type === 'refund.failed') {
        status = 'refund_partial_failed';
      } else if (event.type === 'refund.updated') {
        if (eventDataObject.object === 'refund') {
          if (eventDataObject.status === 'succeeded') {
            status = 'refund_partial_succeeded';
          } else if (eventDataObject.status === 'failed') {
            status = 'refund_partial_failed';
          }
        }
      }
    }

    if (
      status === 'refund_succeeded' ||
      status === 'refund_partial_succeeded'
    ) {
      // 添加退款记录
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          refundedAmount: totalRefundedAmount,
        },
      });
    }

    await tx.transactionRefund.update({
      where: { id: refund.id },
      data: {
        status:
          status === 'refund_succeeded' || status === 'refund_partial_succeeded'
            ? 'succeeded'
            : 'failed',
      },
    });

    return status;
  }
}
