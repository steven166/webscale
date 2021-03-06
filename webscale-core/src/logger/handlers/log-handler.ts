import { Logger } from "../logger";
import { LoggerOptions } from "../logger.options";

export interface LogHandler {

  readonly name: string;

  verbose(logger: Logger, message?: any, ...optionalParams: any[]);

  silly(logger: Logger, message?: any, ...optionalParams: any[]);

  debug(logger: Logger, message?: any, ...optionalParams: any[]);

  info(logger: Logger, message?: any, ...optionalParams: any[]);

  warn(logger: Logger, message?: any, ...optionalParams: any[]);

  error(logger: Logger, message?: any, ...optionalParams: any[]);

}

export interface ConfigurableLogHandler extends LogHandler {

  configure(loggerOptions: LoggerOptions, logger?: Logger): void;

}
