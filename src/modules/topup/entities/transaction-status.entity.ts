import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { TransactionEntity } from './transaction.entity';

export class TransactionStatusEntity extends PickType(TransactionEntity, [
  'id',
  'no',
  'status',
]) {
  constructor(partial: Partial<TransactionStatusEntity>) {
    super();
    Object.assign(this, partial);
  }
}
