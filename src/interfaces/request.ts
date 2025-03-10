import { User } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

export interface Request extends ExpressRequest {
  user: User;
  rawBody: Buffer;
}
