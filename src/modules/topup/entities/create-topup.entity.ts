import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StripeCheckoutUiMode } from '../dtos/create-topup.dto';

export class CreateTopupEntity {
  constructor(partial: Partial<CreateTopupEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty({
    description: '交易id',
  })
  transactionId: string;

  @ApiProperty({
    description: '交易编号',
  })
  tranactionNo: string;

  @ApiProperty({
    description: 'Stripe的clientPublishableKey',
  })
  clientPublishableKey: string;

  @ApiPropertyOptional({
    description: '当UI Mode是embedded或custom的时候Stripe的clientSecret',
  })
  clientSecret: string | null;

  @ApiPropertyOptional({
    description: '当UI Mode是hosted的时候支付的跳转url',
  })
  redirectUrl: string | null;

  @ApiProperty({
    description: 'Stripe的ui mode',
    enum: StripeCheckoutUiMode,
  })
  uiMode: StripeCheckoutUiMode;
}
