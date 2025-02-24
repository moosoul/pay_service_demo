import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRefundDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({
    description: '退款原因',
  })
  reason: string;

  @ApiPropertyOptional({
    description:
      '退款金额，不传则退款全部金额。单位：分，最小为0，必须为整数。',
  })
  @Type(() => Number)
  @IsNumber()
  @IsInt({ message: '退款金额必须是整数' })
  @Min(0, { message: '退款金额不能小于0' })
  @IsOptional()
  amount?: number;
}
