import morgan from 'morgan';
import { Request, Response } from 'express';
import config from '../config';

// Custom token for user ID
morgan.token('user-id', (req: Request) => {
  return (req as any).user?.id || 'anonymous';
});

// Custom token for response time in ms
morgan.token('response-time-ms', (_req: Request, res: Response) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '-';
});

// Development format - detailed logging
const developmentFormat = ':method :url :status :response-time ms - :res[content-length] - :user-id - :remote-addr - :user-agent';

// Production format - structured logging
const productionFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time',
  contentLength: ':res[content-length]',
  userId: ':user-id',
  remoteAddr: ':remote-addr',
  userAgent: ':user-agent',
  timestamp: ':date[iso]',
});

// Create logger based on environment
const requestLogger = config.server.nodeEnv === 'production'
  ? morgan(productionFormat, {
      skip: (req: Request, _res: Response) => {
        // Skip logging for health checks and static assets
        return req.url === '/health' || req.url.startsWith('/static');
      },
      stream: {
        write: (message: string) => {
          try {
            const logData = JSON.parse(message.trim());
            console.log(JSON.stringify({
              level: 'info',
              type: 'http_request',
              ...logData,
            }));
          } catch (error) {
            console.log(message.trim());
          }
        },
      },
    })
  : morgan(developmentFormat, {
      skip: (req: Request, _res: Response) => {
        // Skip logging for health checks in development too
        return req.url === '/health';
      },
    });

export default requestLogger;
