export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string = 'error',
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, code = 'bad_request') {
    return new ApiError(400, message, code);
  }

  static unauthorized(message = 'Authentication required', code = 'unauthorized') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'You do not have permission to do that', code = 'forbidden') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Not found', code = 'not_found') {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code = 'conflict') {
    return new ApiError(409, message, code);
  }
}
