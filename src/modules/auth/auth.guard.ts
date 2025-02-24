import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    // TODO: 目前仅使用uuid，后续登录需要正常使用JWT
    // TODO: 后续需要使用JWT
    // TODO: 可以补充上Redis验证
    // const payload = await this.jwtService.verifyAsync(token, {
    //   secret: 'secret',
    // });

    // 此处的token是用户的uuid
    try {
      const user = await this.usersService.findOne(token);
      if (!user) {
        throw new UnauthorizedException();
      }
      request['user'] = user;
      return true;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    if (request.headers.authorization) {
      if (request.headers.authorization.startsWith('Bearer')) {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        if (type === 'Bearer') {
          return token;
        }
      }
      return request.headers.authorization;
    }
  }
}
