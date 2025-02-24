import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  SerializeOptions,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { TopupService } from './topup.service';
import { CreateTopupDto } from './dtos/create-topup.dto';
import { AuthGuard } from '../auth/auth.guard';
import { TransactionEntity } from './entities/transaction.entity';
import { CreateTopupEntity } from './entities/create-topup.entity';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { createResponseType } from '@/utils/http-response';
import { TransactionStatusEntity } from './entities/transaction-status.entity';
import { CreateRefundDto } from './entities/create-refund.dto';

@ApiTags('充值')
@ApiHeader({
  name: 'Authorization',
  description:
    'demo环境使用用户的UUID, 73687270-1b0b-400e-b0d3-6f6816c0e707, 4bf83df0-21a4-41ff-a9f5-0bd3cee04b46',
  required: true,
  schema: {
    type: 'string',
    example: '73687270-1b0b-400e-b0d3-6f6816c0e707',
  },
})
@UseGuards(AuthGuard)
@Controller('topup')
export class TopupController {
  constructor(private readonly topupService: TopupService) {}

  @ApiOperation({ summary: '充值 - 创建' })
  @ApiOkResponse({
    description: '成功',
    type: createResponseType(CreateTopupEntity),
  })
  @Post()
  async create(@Body() body: CreateTopupDto): Promise<CreateTopupEntity> {
    return this.topupService.create(body);
  }

  @ApiOperation({ summary: '充值 - 详情' })
  @ApiOkResponse({
    description: '成功',
    type: createResponseType(TransactionEntity),
  })
  @ApiParam({
    name: 'id',
    description: '充值ID, UUID',
    type: 'string',
    example: '66866b93-b8af-412a-926f-5ccb4fa1ac0e',
  })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TransactionEntity> {
    return this.topupService.findOne(id);
  }

  @ApiOperation({ summary: '充值 - 状态' })
  @ApiOkResponse({
    type: createResponseType(TransactionStatusEntity),
  })
  @ApiParam({
    name: 'id',
    description: '充值ID, UUID',
    type: 'string',
    example: '66866b93-b8af-412a-926f-5ccb4fa1ac0e',
  })
  @Get(':id/status')
  async findOneStatus(
    @Param('id') id: string,
  ): Promise<TransactionStatusEntity> {
    return this.topupService.findOneStatus(id);
  }

  @ApiOperation({ summary: '充值 - 退款' })
  @ApiOkResponse({
    description: '成功',
  })
  @ApiParam({
    name: 'id',
    description: '充值ID, UUID',
    type: 'string',
    example: '66866b93-b8af-412a-926f-5ccb4fa1ac0e',
  })
  @Post(':id/refund')
  async refund(@Param('id') id: string, @Body() body: CreateRefundDto) {
    return this.topupService.refund(id, body);
  }
}
