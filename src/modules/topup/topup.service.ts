import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CreateTopupDto, StripeCheckoutUiMode } from './dtos/create-topup.dto';
import { StripeService } from '@libs/stripe';
import { CreateTopupEntity } from './entities/create-topup.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionStatusEntity } from './entities/transaction-status.entity';
import { ConfigService } from '@nestjs/config';
import { TransactionRefundStatus, TransactionStatus } from '@prisma/client';
import { REQUEST } from '@nestjs/core';
import { Request } from '@/interfaces/request';
import Stripe from 'stripe';
import randomatic from 'randomatic';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';
import BigNumber from 'bignumber.js';
import { CreateRefundDto } from './entities/create-refund.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ scope: Scope.REQUEST })
export class TopupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly configService: ConfigService,
    @Inject(REQUEST) private readonly request: Request,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  async create(dto: CreateTopupDto) {
    const { transaction, session } = await this.prisma.$transaction(
      async (tx) => {
        const no = await this.generateTransactionNo(); /// 交易订单号
        const expiredAt = new Date(Date.now() + 1800 * 1000); /// 过期时间

        const products = await tx.product.findMany({
          where: { id: { in: dto.products.map((item) => item.id) } },
        });

        const missingIds = dto.products
          .map((item) => item.id)
          .filter((id) => !products.some((p) => p.id === id));

        if (missingIds.length > 0) {
          throw new NotFoundException(
            `Products not found: ${missingIds.join(', ')}`,
          );
        }

        const exchangedProducts = await Promise.all(
          dto.products.map(async (item) => {
            const product = products.find((p) => p.id === item.id);
            const rate = await this.exchangeRateService.exchange(
              product.currencyCode,
              dto.currencyCode,
            );
            const amount = new BigNumber(product.amount)
              .times(rate)
              .integerValue(BigNumber.ROUND_HALF_UP)
              .toNumber();
            return {
              ...product,
              amount,
              quantity: item.quantity,
              rate,
            };
          }),
        );

        // TODO: 需要做汇率转换, 接入对应的汇率操作
        const lineItems: Array<Stripe.Checkout.SessionCreateParams.LineItem> =
          exchangedProducts.map((item) => {
            return {
              price_data: {
                currency: dto.currencyCode,
                product_data: { name: item.name },
                unit_amount: item.amount,
              },
              quantity: item.quantity,
            };
          });

        const amount = lineItems
          .map((item) =>
            new BigNumber(item.price_data.unit_amount)
              .times(item.quantity)
              .integerValue()
              .toNumber(),
          )
          .reduce((a, b) => a + b, 0);

        const transaction = await tx.transaction.create({
          data: {
            amount,
            currency: dto.currencyCode,
            status: TransactionStatus.pending,
            userId: this.request.user.id,
            expiredAt,
            no,
          },
        });
        await tx.productOnTransaction.createMany({
          data: exchangedProducts.map((item) => ({
            productAmount: item.amount,
            productCurrency: item.currencyCode,
            productQuantity: item.quantity,
            rate: item.rate,
            productMetadata: item,
            transactionId: transaction.id,
            productId: item.id,
          })),
        });

        let successUrl: string;
        let returnUrl: string;
        let cancelUrl: string;

        if (dto.uiMode === StripeCheckoutUiMode.hosted) {
          successUrl = `${dto.callbackUrl}?transactionId=${transaction.id}`;
          cancelUrl = `${dto.cancelUrl}?transactionId=${transaction.id}`;
        }
        if (dto.uiMode === StripeCheckoutUiMode.embedded) {
          returnUrl = `${dto.callbackUrl}?transactionId=${transaction.id}`;
        }

        const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
          payment_method_types: ['card'],
          line_items: lineItems,
          currency: dto.currencyCode,
          mode: 'payment',
          ui_mode: dto.uiMode as any, //'custom' as any,
          success_url: successUrl,
          return_url: returnUrl,
          cancel_url: cancelUrl,
          expires_at: Math.floor(Date.now() / 1000) + 1800, // 过期时间1800秒
          // discounts: [
          //   {
          //     coupon: '',
          //     promotion_code: '',
          //   },
          // ],
          payment_intent_data: {
            metadata: {
              transactionId: transaction.id,
              transactionNo: transaction.no,
            },
          },
          metadata: {
            transactionId: transaction.id,
            transactionNo: transaction.no,
          },
        };

        const session =
          await this.stripe.checkout.sessions.create(sessionCreateParams);

        await tx.stripePaymentData.create({
          data: {
            id: session.id,
            type: 'checkout_session',
            requestMetadata: sessionCreateParams as any,
            responseMetadata: session as any,
            transactionId: transaction.id,
          },
        });

        const updatedTransaction = await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.pending,
            stripePaymentStatus: 'checkout.session.created',
          },
        });
        return { transaction: updatedTransaction, session };
      },
    );

    // console.log(session);
    return new CreateTopupEntity({
      clientPublishableKey: this.stripe.publishableKey,
      clientSecret: session.client_secret,
      uiMode: dto.uiMode,
      redirectUrl: session.url,
      transactionId: transaction.id,
      tranactionNo: transaction.no,
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        no: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        productOnTransactions: {
          include: {
            product: true,
          },
        },
        userId: true,
      },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction id = ${id} not found`);
    }
    if (transaction.userId !== this.request.user.id) {
      throw new ForbiddenException(
        'You are not allowed to access this transaction',
      );
    }

    return new TransactionEntity(transaction);
  }

  async findOneStatus(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
        userId: true,
      },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction id = ${id} not found`);
    }

    if (transaction.userId !== this.request.user.id) {
      throw new ForbiddenException(
        'You are not allowed to access this transaction',
      );
    }

    // TODO: 手动查询一次stripe的api

    return new TransactionStatusEntity(transaction);
  }

  async refund(id: string, dto: CreateRefundDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: {
        id,
      },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction id = ${id} not found`);
    }
    if (transaction.userId !== this.request.user.id) {
      throw new ForbiddenException(
        'You are not allowed to access this transaction',
      );
    }

    if (
      transaction.status !== TransactionStatus.succeeded &&
      transaction.status !== TransactionStatus.refund_partial_pending &&
      transaction.status !== TransactionStatus.refund_partial_succeeded
    ) {
      throw new BadRequestException('Transaction status is not succeeded');
    }

    const stripePaymentData = await this.prisma.stripePaymentData.findFirst({
      where: {
        transactionId: transaction.id,
        type: 'payment_intent',
      },
    });
    if (!stripePaymentData) {
      throw new NotFoundException('Stripe payment data not found');
    }

    // 退款中和已退款的金额
    const refundAmount = await this.prisma.transactionRefund.aggregate({
      where: {
        transactionId: transaction.id,
        status: { not: TransactionRefundStatus.failed },
      },
      _sum: {
        amount: true,
      },
    });
    if (dto.amount) {
      if (dto.amount > transaction.amount - (refundAmount._sum.amount || 0)) {
        throw new BadRequestException(
          'Refund amount is greater than transaction amount',
        );
      }
    } else {
      dto.amount = transaction.amount - (refundAmount._sum.amount || 0);
    }

    try {
      const id = uuidv4();
      const amount = dto.amount || transaction.amount;
      const refundCreateParams: Stripe.RefundCreateParams = {
        amount,
        payment_intent: stripePaymentData.id,
        reason: 'requested_by_customer',
        metadata: {
          transactionId: transaction.id,
          transactionNo: transaction.no,
          refundId: id,
        },
      };
      const refund = await this.stripe.refunds.create(refundCreateParams);
      await this.prisma.$transaction(async (tx) => {
        await this.prisma.transactionRefund.create({
          data: {
            id,
            transactionId: transaction.id,
            amount: refund.amount,
            currency: transaction.currency,
            reason: dto.reason || refund.reason,
            status: 'pending',
          },
        });

        await this.prisma.transaction.update({
          where: {
            id: transaction.id,
          },
          data: {
            status:
              dto.amount === transaction.amount
                ? 'refund_pending'
                : 'refund_partial_pending',
          },
        });
      });

      return 'ok';
    } catch (e) {
      console.log(e);
      throw new BadGatewayException('退款创建失败');
    }
  }

  private async generateTransactionNo() {
    const prefix = 'T';
    /// 年月日时分秒随机6位
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const day = new Date().getDate();
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    const second = new Date().getSeconds();
    const random = randomatic('0', 6);
    const no = `${prefix}${year}${month}${day}${hour}${minute}${second}${random}`;
    const isExist = await this.prisma.transaction.findUnique({
      where: {
        no,
      },
    });
    if (isExist) {
      return await this.generateTransactionNo();
    }
    return no;
  }
}
