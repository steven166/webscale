import {LogLevel} from "./log-level";
import {LogHandler} from "./handlers";

export interface LoggerOptions {

  level?: LogLevel;
  handlers?: Array<string | LogHandler>;

}