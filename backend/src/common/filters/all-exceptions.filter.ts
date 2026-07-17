import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

// Postgres error codes worth mapping to a client-facing 4xx instead of a
// generic 500 — see https://www.postgresql.org/docs/current/errcodes-appendix.html
// Several controllers (student, school, staff) accept `@Body() dto: any`
// with no class-validator DTO, so malformed input (bad UUID, wrong FK,
// duplicate unique value) reaches Postgres raw instead of being rejected
// by the ValidationPipe — this filter is the last line of defense against
// leaking a raw driver error as an unhandled 500.
const POSTGRES_STATUS_MAP: Record<string, HttpStatus> = {
  '22P02': HttpStatus.BAD_REQUEST, // invalid_text_representation (e.g. malformed UUID)
  '23502': HttpStatus.BAD_REQUEST, // not_null_violation
  '23503': HttpStatus.BAD_REQUEST, // foreign_key_violation
  '23505': HttpStatus.CONFLICT, // unique_violation
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const timestamp = new Date().toISOString();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = (exceptionResponse as any)?.message || exception.message;
      error = (exceptionResponse as any)?.error || exception.name;
    } else if (exception instanceof QueryFailedError) {
      const pgCode = (exception as any)?.driverError?.code;
      status = POSTGRES_STATUS_MAP[pgCode] || HttpStatus.INTERNAL_SERVER_ERROR;
      error = status === HttpStatus.INTERNAL_SERVER_ERROR ? 'InternalServerError' : 'BadRequestException';
      message =
        status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : 'Invalid request data';
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    const errorResponse = {
      statusCode: status,
      timestamp,
      path: request.url,
      method: request.method,
      error,
      message,
    };

    // Log error
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${request.method} ${request.url}`, exception);
    } else if (status >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(`${request.method} ${request.url} - ${message}`);
    }

    response.status(status).json(errorResponse);
  }
}
