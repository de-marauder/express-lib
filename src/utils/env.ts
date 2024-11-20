import dotenv from 'dotenv';

dotenv.config();
type Keys<O extends Record<string, unknown>> = keyof O
import { LogTrail } from './logger';

// Call this class with an enum-like object to store the object and access it with the `env` method
export class EnvService {
  name= 'EnvService'
  logger = new LogTrail(this.name)
  
  varsEnum = {};
  
  // varsEnum = {
  //   PORT: "PORT",
  //   NODE_ENV: "NODE_ENV",
  //   JWT_SECRET: "JWT_SECRET",
  //   JWT_EXPIRES_IN: "JWT_EXPIRES_IN",
  // }
  constructor(vars: Record<string, string>) {
    this.varsEnum = vars;
    this.validateEnv();
  }

  env = (key: string) => {
    const value = process.env[key]!;
    return value;
  }

  validateEnv = () => {
    for (const key in this.varsEnum) {
      const k = key as Keys<typeof this.varsEnum>;
      if (!this.env(this.varsEnum[k as Keys<typeof this.varsEnum>])) {
        throw new Error(`${this.varsEnum[k]} is required`);
      }
    }

    this.logger.log(`============================`);
    this.logger.log('ENV variables loaded')
    this.logger.log(`============================`);
  }

}
