import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

/** Payload attached to `req.user` by JWT strategy / guards */
export interface JwtRequestUser {
  userId?: number;
  sub?: number;
  email?: string;
  role?: string;
}

/** Resolves numeric user id for guarded routes (throws if JWT payload is incomplete). */
export function getJwtUserId(user: JwtRequestUser): number {
  const id = user.userId ?? user.sub;
  if (id === undefined || id === null) {
    throw new UnauthorizedException();
  }
  return Number(id);
}

export type JwtAuthedRequest = Request & { user: JwtRequestUser };
export type JwtOptionalRequest = Request & { user?: JwtRequestUser };
