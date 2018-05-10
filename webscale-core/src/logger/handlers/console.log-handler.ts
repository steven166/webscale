import { LogHandler } from "./log-handler";
import { Logger } from "../logger";

/**
 * Log handler for Console logging
 */
export class ConsoleLogHandler implements LogHandler {

  public readonly name = "console";

  public verbose(logger: Logger, message?: any, ...optionalParams: any[]) {
    // tslint:disable-next-line
    console.info(`[verb] [${logger.namespace}]`, message, ...optionalParams);
  }

  debug(logger: Logger, message?: any, ...optionalParams: any[]) {
    // tslint:disable-next-line
    console.info(`[debu] [${logger.namespace}]`, message, ...optionalParams);
  }

  error(logger: Logger, message?: any, ...optionalParams: any[]) {
    // tslint:disable-next-line
    console.info(`[erro] [${logger.namespace}]`, message, ...optionalParams);
  }

  info(logger: Logger, message?: any, ...optionalParams: any[]) {
    // tslint:disable-next-line
    console.info(`[info] [${logger.namespace}]`, message, ...optionalParams);
  }

  silly(logger: Logger, message?: any, ...optionalParams: any[]) {
    // tslint:disable-next-line
    console.info(`[sill] [${logger.namespace}]`, message, ...optionalParams);
  }

  warn(logger: Logger, message?: any, ...optionalParams: any[]) {
    // tslint:disable-next-line
    console.info(`[warn] [${logger.namespace}]`, message, ...optionalParams);
  }

}
