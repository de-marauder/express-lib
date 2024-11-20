import type { NextFunction, Request, Response } from "express";
import { JWTService, logger } from "../utils";
import Joi from "joi";
import { APIError } from "../utils"
import { JsonWebTokenError } from "jsonwebtoken";


export class MiddlewareService {

  constructor(private jwt: JWTService) { }

  // Request Logger Middleware
  requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const method = req.method;
    const url = req.originalUrl;

    logger.log(method, url);

    next();
  };

  // Error Handler Middleware
  errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(err);
    let statusCode = 500;
    let message = 'Internal Server Error';
    let response: Record<string, any> = { statusCode: statusCode, message: message };

    if (err instanceof APIError) {
      response.statusCode = err.statusCode;
      response.message = err.message;
    } else if (err instanceof Joi.ValidationError) {
      response.statusCode = 400;
      response.message = err.message;
      response.errors = err.details;
    } else if (err instanceof JsonWebTokenError) {
      response.statusCode = 401;
      response.message = err.message;
      response.errors = err.inner;
    }

    return res.status(response.statusCode).json(response);
  }

  // Authentication Middleware
  auth = HandlerWrapper(async (req: Request, res: Response, next: NextFunction) => {
    await authFn(req);
    next();
  })

  admin = HandlerWrapper(async (req: Request, res: Response, next: NextFunction) => {
    await adminAuthFn(req);
    if (!isAdmin(req.body._role?.name)) return res.status(401).json({ error: 'Unauthorized' });
    next();
  })

  super_admin = HandlerWrapper(async (req: Request, res: Response, next: NextFunction) => {
    await adminAuthFn(req);
    if (!isSuperAdmin(req.body._role?.name)) return res.status(401).json({ error: 'Unauthorized' });
    next();
  })

}