import { Logger } from "../logger";
import { LogHandler } from "./log-handler";

/**
 * Log handler for Console logging
 */
export class ConsoleLogHandler implements LogHandler {

  public readonly name = "console";

  public verbose(logger: Logger, message?: any, ...optionalParams: any[]) {
    // tslint:disable-next-line
    console.info(`[verb] [${logger.namespace}]`, message, ...optionalParams);
  }

  public debug(logger: Logger, message?: any, ...optionalParams: any[]) {
    // tslint:disable-next-line
    console.info(`[debu] [${logger.namespace}]`, message, ...optionalParams);
  }

  public error(logger: Logger, message?: any, ...optionalParams: any[]) {
    // tslint:disable-next-line
    console.info(`[erro] [${logger.namespace}]`, message, ...optionalParams);
  }

  public info(logger: Logger, message?: any, ...optionalParams: any[]) {
    // tslint:disable-next-line
    console.info(`[info] [${logger.namespace}]`, message, ...optionalParams);
  }

  public silly(logger: Logger, message?: any, ...optionalParams: any[]) {
    // tslint:disable-next-line
    console.info(`[sill] [${logger.namespace}]`, message, ...optionalParams);
  }

  public warn(logger: Logger, message?: any, ...optionalParams: any[]) {
    // tslint:disable-next-line
    console.info(`[warn] [${logger.namespace}]`, message, ...optionalParams);
  }

}
