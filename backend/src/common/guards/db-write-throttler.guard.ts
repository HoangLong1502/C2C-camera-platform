import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class DbWriteThrottlerGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ method?: string }>();
    const method = request?.method?.toUpperCase();

    // Only throttle database write-like HTTP methods.
    if (!method || !['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return true;
    }

    return super.canActivate(context);
  }
}
