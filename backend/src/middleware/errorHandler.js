// Centralized error handler — keep controllers clean by throwing/next(err)
// and letting this format the response consistently.
export function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

  const status = err.statusCode || 500;
  const message = err.expose ? err.message : 'Internal server error';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Helper to throw errors that are safe to show to the client
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.expose = true;
  }
}
