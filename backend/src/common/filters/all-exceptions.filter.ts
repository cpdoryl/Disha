import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

// Postgres error codes that indicate a malformed request (bad client input),
// not a server-side failure - these should surface as 400s, not 500s.
const POSTGRES_BAD_INPUT_CODES = new Set([
  '22P02', // invalid_text_representation (e.g. malformed UUID)
  '22007', // invalid_datetime_format
  '23502', // not_null_violation
]);

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
    } else if (
      exception instanceof QueryFailedError &&
      POSTGRES_BAD_INPUT_CODES.has((exception as any).code)
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid request: malformed identifier or missing required field';
      error = 'BadRequest';
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
