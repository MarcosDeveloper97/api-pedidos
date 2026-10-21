// Erro "esperado" (de negócio/validação). Qualquer outro erro vira HTTP 500.
class AppError extends Error {
  constructor(message, statusCode, detalhes) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.detalhes = detalhes;
  }
}

class ValidationError extends AppError {
  constructor(message, detalhes) {
    super(message, 400, detalhes);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

module.exports = { AppError, ValidationError, NotFoundError };
