import { ApiProperty } from '@nestjs/swagger';

export class HttpResponseEntity<T> {
  @ApiProperty({ description: '状态码' })
  code: number;

  @ApiProperty({ description: '数据' })
  data: T;

  @ApiProperty({ description: '消息' })
  message: string;
}

// 为了让 Swagger 正确识别泛型类型，需要创建一个工厂函数
export function createResponseType<T>(type: new (partial: Partial<T>) => T) {
  class ResponseType extends HttpResponseEntity<T> {
    @ApiProperty({ type })
    declare data: T;
  }

  // 保持类名为动态的，便于 Swagger 区分不同的响应类型
  Object.defineProperty(ResponseType, 'name', {
    value: `Response${type.name}`,
  });

  return ResponseType;
}
