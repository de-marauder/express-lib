import type { NextFunction, Request, Response } from "express";

type RequestHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

export const HandlerWrapper = (handler: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (err: any) {
      req.body._err = err
      next(err);
    }
  }
}