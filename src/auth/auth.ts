import type { Request } from "express";
import bcrypt from 'bcryptjs';
import { APIError, type JWTService } from '../utils';
import { UserTypes } from "./types";

export interface BaseUser {
  id?: string;
  phoneNumber?: string;
  password: string;
  email?: string;
}

class AuthService<User extends BaseUser> {

  constructor(private config: { saltRounds: number | string, jwt: JWTService }) { }

  validatePayload(data: Partial<BaseUser>) {
    if (!data.email && !data.phoneNumber) {
      throw new Error('Email or phone number required');
    }
    if (!data.password) {
      throw new Error('Password is required');
    }
  }

  generateJWT(user: User): string {
    return this.config.jwt.signPayloadToToken({ id: user.id });
  }

  hashPassword = async (password: string) => {
    if (!password) {
      throw new Error('Password is required');
    }
    return await bcrypt.hash(password!, this.config.saltRounds);
  }

  authenticate = async (req: Request) => {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token as string
    if (!token) throw new APIError('No token provided', 401);
    const decoded = this.config.jwt.extractPayloadFromToken(token);
    if (!decoded) throw new APIError('Unauthorized', 401);

    req.body._jwtPayload = decoded
  }

  adminAuthFn = async (req: Request) => {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token as string
    const decoded = this.config.jwt.extractPayloadFromToken(token);
    if (!decoded) throw new APIError('Unauthorized', 401);

    req.body._role = UserTypes.Admin;
  }
}

export default AuthService;