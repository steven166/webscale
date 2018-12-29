import { ConfigurableLogHandler } from "./handlers";
import { ConsoleLogHandler } from "./handlers/console.log-handler";
import { LogHandler } from "./handlers/log-handler";
import { LogLevel } from "./log-level";
import { LoggerOptions } from "./logger.options";
import { LoggerProperties } from "./logger.properties";

const DEFAULT_LOGGER_NAMESPACE = "default";

// tslint:disable-next-line
const LogLevelValues: { [level: string]: number } = {
  silly: 1,
  debug: 2,
  verbose: 3,
  info: 4,
  warn: 5,
  error: 6,
  off: 7
};

/**
 * Logger
 */
export class Logger {

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
   * Configure loggers
   * @param {LoggerProperties} options
   */
  public static configure(options: LoggerProperties): void {
    Logger.defaultProperties = options;
    if (options.level) {
      Logger.level = options.level;
    }
    if (options.handlers) {
      options.handlers = [];
      options.handlers.forEach(h => Logger.useHandler(h, options));
    }
    if (options.namespaces) {
      for (let namespace in options.namespaces) {
        Logger.create(namespace).configure(options.namespaces[namespace]);
      }
    }
  }

  /**
   * Register a log handler
   * @param {LogHandler} logHandler
   */
  public static registerHandler(logHandler: LogHandler): void {
    Logger.registeredHandlers.push(logHandler);
  }

  /**
   * Use a log handler
   * @param {LogHandler | string} logHandler
   * @param options
   */
  public static useHandler(logHandler: LogHandler | string, options?: LoggerOptions): void {
    if (typeof(logHandler) === "string") {
      logHandler = Logger.registeredHandlers.find(h => h.name === logHandler);
    }
    if (!logHandler) {
      throw new Error(`Unknown log handler '${logHandler}'`);
    }
    if (options && (logHandler as ConfigurableLogHandler).configure) {
      (logHandler as ConfigurableLogHandler).configure(options);
    }
    Logger.logHandlers.push(logHandler);
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
   * List of created loggers
   * @type {{}}
   */
  private static loggers: { [namespace: string]: Logger } = {};

  /**
   * Registered log handlers
   * @type {ConsoleLogHandler[]}
   */
  private static registeredHandlers: LogHandler[] = [new ConsoleLogHandler()];

  /**
   * Used log handlers
   * @type {any[]}
   */
  private static logHandlers: LogHandler[] = [new ConsoleLogHandler()];

  /**
   * Default configured properties
   */
  private static defaultProperties: LoggerOptions;

  /**
   * Log level
   */
  private _level: LogLevel;

  /**
   * Used log handlers
   * @type {LogHandler[]}
   */
  private _handlers: LogHandler[] = [];

  /**
   * Create a new logger for a namespace
   * @param {string} namespace
   */
  constructor(public readonly namespace: string) {
  }

  public configure(options: LoggerOptions): void {
    if (options.level) {
      this.level = options.level;
    }
    if (options.handlers) {
      options.handlers.forEach(handler => {
        this.useHandler(handler, options);
      });
    }
  }

  /**
   * Use a log handler
   * @param {LogHandler | string} logHandler
   * @param options
   */
  public useHandler(logHandler: LogHandler | string, options?: LoggerOptions): void {
    if (typeof(logHandler) === "string") {
      logHandler = Logger.registeredHandlers.find(h => h.name === logHandler);
    }
    if (!logHandler) {
      throw new Error(`Unknown log handler '${logHandler}'`);
    }
    if ((logHandler as ConfigurableLogHandler).configure) {
      (logHandler as ConfigurableLogHandler).configure(options, this);
    }
    this._handlers.push(logHandler);
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

  public get handlers(): LogHandler[] {
    return Logger.logHandlers.concat(this._handlers);
  }

  /**
   * Log a silly message
   * @param message
   * @param optionalParams
   */
  public silly(message?: any, ...optionalParams: any[]) {
    this.log(LogLevel.SILLY, message, ...optionalParams);
  }

  /**
   * Log a verbose message
   * @param message
   * @param optionalParams
   */
  public verbose(message?: any, ...optionalParams: any[]) {
    this.log(LogLevel.VERBOSE, message, ...optionalParams);
  }

  /**
   * Log a message
   * @param {LogLevel} level
   * @param message
   * @param optionalParams
   */
  public log(level: LogLevel, message?: any, ...optionalParams: any[]) {
    if (this.shouldLog(level)) {
      switch (level) {
        case LogLevel.VERBOSE:
          this.handlers.forEach(h => h.verbose(this, message, ...optionalParams));
          break;
        case LogLevel.SILLY:
          this.handlers.forEach(h => h.silly(this, message, ...optionalParams));
          break;
        case LogLevel.DEBUG:
          this.handlers.forEach(h => h.debug(this, message, ...optionalParams));
          break;
        case LogLevel.INFO:
          this.handlers.forEach(h => h.info(this, message, ...optionalParams));
          break;
        case LogLevel.WARN:
          this.handlers.forEach(h => h.warn(this, message, ...optionalParams));
          break;
        case LogLevel.ERROR:
          this.handlers.forEach(h => h.error(this, message, ...optionalParams));
          break;
        default:
          throw new Error(`Unknown loglevel '${level}'`);
      }
    }
  }

  /**
   * Log a debug message
   * @param message
   * @param optionalParams
   */
  public debug(message?: any, ...optionalParams: any[]) {
    this.log(LogLevel.DEBUG, message, ...optionalParams);
  }

  /**
   * Log an info message
   * @param message
   * @param optionalParams
   */
  public info(message?: any, ...optionalParams: any[]) {
    this.log(LogLevel.INFO, message, ...optionalParams);
  }

  /**
   * Log awarning message
   * @param message
   * @param optionalParams
   */
  public warn(message?: any, ...optionalParams: any[]) {
    this.log(LogLevel.WARN, message, ...optionalParams);
  }

  /**
   * Log an error message
   * @param message
   * @param optionalParams
   */
  public error(message?: any, ...optionalParams: any[]) {
    this.log(LogLevel.ERROR, message, ...optionalParams);
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
