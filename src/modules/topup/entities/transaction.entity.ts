import { $Enums, Transaction } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JsonValue } from '@prisma/client/runtime/library';
import { ProductEntity } from './product.entity';

export class TransactionEntity implements Transaction {
  constructor(partial?: Partial<TransactionEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty({
    description: '交易ID',
  })
  id: string;

  @ApiProperty({
    description: '用户ID',
  })
  userId: string;

  @ApiProperty({
    description: '交易编号',
  })
  no: string;

  @ApiProperty({
    description: '金额',
  })
  amount: number;

  @ApiProperty({
    description: '已退款金额',
  })
  refundedAmount: number;

  @ApiProperty({
    description: '货币',
  })
  currency: string;

  @ApiProperty({
    description: '过期时间',
  })
  expiredAt: Date;

  @ApiProperty({
    description: '交易状态',
  })
  status: $Enums.TransactionStatus;

  @ApiProperty({
    description: '失败原因',
  })
  failedReason: string;

  @ApiProperty({
    description: '退款原因',
  })
  refundReason: string;

  @ApiProperty({
    description: '请求元数据',
  })
  requestMetadata: JsonValue;

  @ApiProperty({
    description: '响应元数据',
  })
  responseMetadata: JsonValue;

  @ApiProperty({
    description: '创建时间',
  })
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
  })
  updatedAt: Date;

  @ApiProperty({
    description: '删除时间',
  })
  deletedAt: Date;

  @ApiPropertyOptional({
    description: 'Stripe支付状态, 可参考webhook对应的事件',
  })
  stripePaymentStatus: string;

  @ApiProperty({
    description: '产品列表',
  })
  products: ProductEntity[];
}
