import { LogLevel } from "./log-level";
import { LogHandler } from "./handlers/log-handler";
import { ConsoleLogHandler } from "./handlers/console.log-handler";

const DEFAULT_LOGGER_NAMESPACE = "default";

const LogLevelValues: {[level:string]: number} = {
  "verbose": 1,
  "silly": 2,
  "debug": 3,
  "info": 4,
  "warn": 5,
  "error": 6,
  "off": 7
};

/**
 * Logger
 */
export class Logger {

  /**
   * List of created loggers
   * @type {{}}
   */
  private static loggers: { [namespace: string]: Logger } = {};

  /**
   * Global log level
   * @type {LogLevel.INFO}
   */
  public static level: LogLevel = LogLevel.INFO;

  /**
   * Create a logger or get an existing logger
   * @param {string} namespace
   * @returns {Logger}
   */
  public static create(namespace: string = DEFAULT_LOGGER_NAMESPACE): Logger {
    let logger = Logger.loggers[namespace];
    if (!logger) {
      logger = new Logger(namespace);
      Logger.loggers[namespace] = logger;
    }
    return logger;
  }

  /**
   * Log a verbose message
   * @param message
   * @param optionalParams
   */
  public static verbose(message?: any, ...optionalParams: any[]) {
    Logger.create().verbose(message, ...optionalParams);
  }

  /**
   * Log a silly message
   * @param message
   * @param optionalParams
   */
  public static silly(message?: any, ...optionalParams: any[]) {
    Logger.create().silly(message, ...optionalParams);
  }

  /**
   * Log a message
   * @param {LogLevel} level
   * @param message
   * @param optionalParams
   */
  public static log(level: LogLevel, message?: any, ...optionalParams: any[]) {
    Logger.create().log(level, message, ...optionalParams);
  }

  /**
   * Log a debug message
   * @param message
   * @param optionalParams
   */
  public static debug(message?: any, ...optionalParams: any[]) {
    Logger.create().debug(message, ...optionalParams);
  }

  /**
   * Log an info message
   * @param message
   * @param optionalParams
   */
  public static info(message?: any, ...optionalParams: any[]) {
    Logger.create().info(message, ...optionalParams);
  }

  /**
   * Log a warning message
   * @param message
   * @param optionalParams
   */
  public static warn(message?: any, ...optionalParams: any[]) {
    Logger.create().warn(message, ...optionalParams);
  }

  /**
   * Log an error message
   * @param message
   * @param optionalParams
   */
  public static error(message?: any, ...optionalParams: any[]) {
    Logger.create().error(message, ...optionalParams);
  }

  /**
   * Log handler
   * @type {ConsoleLogHandler}
   */
  private handler: LogHandler = new ConsoleLogHandler();

  /**
   * Log level
   */
  private _level: LogLevel;

  /**
   * Create a new logger for a namespace
   * @param {string} namespace
   */
  constructor(public readonly namespace: string) {
  }

  /**
   * Set log level
   * @param {LogLevel} level
   */
  public set level(level: LogLevel) {
    this._level = level;
  }

  /**
   * Get the log level, if not set return the global log level
   * @returns {LogLevel}
   */
  public get level(): LogLevel {
    return this._level || Logger.level;
  }

  /**
   * Log a silly message
   * @param message
   * @param optionalParams
   */
  public silly(message?: any, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.SILLY)) {
      this.handler.silly(this, message, ...optionalParams);
    }
  }

  /**
   * Log a verbose message
   * @param message
   * @param optionalParams
   */
  public verbose(message?: any, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.VERBOSE)) {
      this.handler.verbose(this, message, ...optionalParams);
    }
  }

  /**
   * Log a message
   * @param {LogLevel} level
   * @param message
   * @param optionalParams
   */
  public log(level: LogLevel, message?: any, ...optionalParams: any[]) {
    switch (level) {
      case LogLevel.VERBOSE:
        this.verbose(message, ...optionalParams);
        break;
      case LogLevel.SILLY:
        this.silly(message, ...optionalParams);
        break;
      case LogLevel.DEBUG:
        this.debug(message, ...optionalParams);
        break;
      case LogLevel.INFO:
        this.info(message, ...optionalParams);
        break;
      case LogLevel.WARN:
        this.warn(message, ...optionalParams);
        break;
      case LogLevel.ERROR:
        this.error(message, ...optionalParams);
        break;
      default:
        throw new Error(`Unknown loglevel '${level}'`);
    }
  }

  /**
   * Log a debug message
   * @param message
   * @param optionalParams
   */
  public debug(message?: any, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.handler.debug(this, message, ...optionalParams);
    }
  }

  /**
   * Log an info message
   * @param message
   * @param optionalParams
   */
  public info(message?: any, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.handler.info(this, message, ...optionalParams);
    }
  }

  /**
   * Log awarning message
   * @param message
   * @param optionalParams
   */
  public warn(message?: any, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.handler.warn(this, message, ...optionalParams);
    }
  }

  /**
   * Log an error message
   * @param message
   * @param optionalParams
   */
  public error(message?: any, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.handler.error(this, message, ...optionalParams);
    }
  }

  /**
   * Check if a log level should be logged
   * @param {LogLevel} level
   * @returns {boolean}
   */
  public shouldLog(level: LogLevel): boolean {
    return LogLevelValues[level] >= LogLevelValues[this.level];
  }

}