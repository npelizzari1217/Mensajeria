import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '@mensajeria/domain';

/**
 * ExceptionFilter — maps domain errors and HTTP exceptions to
 * consistent API error responses.
 *
 * Error response format: { error: { code: string, message: string } }
 */
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle known NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message ?? exception.message;

      response.status(status).json({
        error: {
          code: this.statusToCode(status),
          message: Array.isArray(message) ? message.join('; ') : message,
        },
      });
      return;
    }

    // Handle domain errors (from Result.Err)
    if (exception instanceof DomainError) {
      const status = this.domainErrorToStatus(exception);
      response.status(status).json({
        error: {
          code: exception.code,
          message: exception.message,
        },
      });
      return;
    }

    // Handle generic errors
    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
    });
  }

  private domainErrorToStatus(error: DomainError): HttpStatus {
    switch (error.code) {
      case 'USER_NOT_FOUND':
      case 'MESSAGE_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'EMAIL_ALREADY_EXISTS':
        return HttpStatus.CONFLICT;
      case 'INVALID_CREDENTIALS':
        return HttpStatus.UNAUTHORIZED;
      case 'UNAUTHORIZED_MESSAGE_ACCESS':
        return HttpStatus.FORBIDDEN;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }

  private statusToCode(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
