import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    let message = exception.message;
    if (exception.getResponse()['message']) {
      let exceptionMessage = exception.getResponse()['message'];
      if (Array.isArray(exceptionMessage)) {
        message = exceptionMessage.join(', ');
      } else {
        message = exceptionMessage;
      }
    }

    response.status(status).json({
      code: status,
      message,
      requestAt: new Date().toISOString(),
      requestPath: request.url,
      requestId: request['requestId'],
    });
  }
}
