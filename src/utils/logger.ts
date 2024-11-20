export class LogTrail {
  private prefix = ' =>'
  level: LogLevel = LogLevel.INFO;

  constructor(private module?: string) {
    this.prefix = `[${module || 'LogTrail'}] =>`;
  }

  log(message: any, level?: LogLevel) {
    console.log(new Date(), this.prefix, level ? `[${level}]` : `[${LogLevel.INFO}]`, message);
  }
  error(message: any) {
    console.error(new Date(), this.prefix, `[${LogLevel.ERROR}]`, message);
  }
}

export const logger = new LogTrail();

export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  TRACE = 'TRACE',
}