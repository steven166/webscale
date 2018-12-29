import { LogHandler } from "./handlers";
import { LogLevel } from "./log-level";

export interface LoggerOptions {

  level?: LogLevel;
  handlers?: Array<string | LogHandler>;

}
