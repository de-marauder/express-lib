import jwt, { type JwtPayload } from 'jsonwebtoken'
import { APIError } from "./errors";

export type JWTServiceConfig = {
  saltRounds: number; jwtSecret: string; jwtExpiration: number;
}
export class JWTService {

  constructor(private config: JWTServiceConfig) { }

  extractPayloadFromToken = (token: string) => {
    if (!token) {
      throw new APIError('No token provided', 401);
    }
    const decoded = jwt.verify(token as string, this.config.jwtSecret);
    return decoded;
  }

  signPayloadToToken<Payload extends JwtPayload>(payload: Payload): string {
    return jwt.sign(
      payload,
      this.config.jwtSecret,
      { expiresIn: this.config.jwtExpiration }
    );
  }
}