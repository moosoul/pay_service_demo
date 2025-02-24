import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum StripeCheckoutUiMode {
  hosted = 'hosted',
  embedded = 'embedded',
  custom = 'custom',
}

export class CreateTopupProductDto {
  @ApiProperty({
    description: '商品ID',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: '商品数量',
  })
  @Type(() => Number)
  @IsNumber()
  quantity: number;
}

export class CreateTopupDto {
  @ApiProperty({
    description: 'Stripe调用的UI模式',
    enum: StripeCheckoutUiMode,
  })
  @IsEnum(StripeCheckoutUiMode)
  uiMode: StripeCheckoutUiMode;

  @ApiProperty({
    description: '支付成功的回调url',
  })
  @IsString()
  callbackUrl: string;

  @ApiPropertyOptional({
    description: '当UI Mode是hosted的时候，点击页面作则的返回按钮跳转的url',
  })
  @IsString()
  @ValidateIf((o) => o.uiMode === StripeCheckoutUiMode.hosted)
  cancelUrl: string;

  @ValidateNested()
  @IsArray()
  @Type(() => CreateTopupProductDto)
  products: CreateTopupProductDto[];

  @ApiProperty({
    description: '货币代码, 默认使用USD支付',
    default: 'USD',
  })
  @IsString()
  @IsOptional()
  currencyCode: string = 'USD';
}
