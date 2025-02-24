import { ApiProperty } from '@nestjs/swagger';
import { Product } from '@prisma/client';

export class ProductEntity implements Product {
  constructor(partial: Partial<ProductEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty({
    description: '产品ID',
  })
  id: string;

  @ApiProperty({
    description: '产品名称',
  })
  name: string;

  @ApiProperty({
    description: '产品金额',
  })
  amount: number;

  @ApiProperty({
    description: '产品货币',
  })
  currencyCode: string;
}
