import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * ResponseInterceptor — wraps all successful responses in { data: ... }.
 *
 * Also handles paginated responses: { data: T[], total, page, pageSize }
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((body) => {
        // If the response is already in our envelope format, pass through
        if (body && (body.data !== undefined || body.error !== undefined)) {
          return body;
        }

        // If it looks like a paginated response
        if (
          body &&
          Array.isArray(body.data) &&
          typeof body.total === 'number'
        ) {
          return {
            data: body.data,
            total: body.total,
            page: body.page ?? 1,
            pageSize: body.pageSize ?? body.data.length,
          };
        }

        // Standard envelope
        return { data: body };
      }),
    );
  }
}
