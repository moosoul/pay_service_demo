import { Observable } from 'rxjs';

import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';

import { map } from 'rxjs';

export class HttpResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return {
          code: 0,
          message: 'ok',
          data,
        };
      }),
    );
  }
}
