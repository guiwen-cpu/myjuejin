import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Response } from 'express'
import { ErrorCodes, type ApiErrorBody } from '@devflow/shared'

function codeForStatus(status: number): string {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return ErrorCodes.UNAUTHORIZED
    case HttpStatus.FORBIDDEN:
      return ErrorCodes.FORBIDDEN
    case HttpStatus.NOT_FOUND:
      return ErrorCodes.NOT_FOUND
    case HttpStatus.CONFLICT:
      return ErrorCodes.CONFLICT
    case HttpStatus.TOO_MANY_REQUESTS:
      return ErrorCodes.RATE_LIMITED
    case HttpStatus.BAD_REQUEST:
      return ErrorCodes.VALIDATION_FAILED
    default:
      return ErrorCodes.INTERNAL_ERROR
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let code: string = ErrorCodes.INTERNAL_ERROR
    let message = 'Internal server error'
    let details: unknown

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      code = codeForStatus(status)
      const body = exception.getResponse()
      if (typeof body === 'string') {
        message = body
      } else if (body && typeof body === 'object') {
        const obj = body as Record<string, unknown>
        if (typeof obj.message === 'string') message = obj.message
        else if (Array.isArray(obj.message)) {
          message = obj.message[0] ?? 'Validation failed'
          details = obj.message
        } else if (typeof obj.error === 'string') message = obj.error
        if (typeof obj.code === 'string') code = obj.code
      }
    } else {
      this.logger.error(exception)
    }

    const payload: ApiErrorBody = { statusCode: status, code, message, details }
    response.status(status).json(payload)
  }
}
