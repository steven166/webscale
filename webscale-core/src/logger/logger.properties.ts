import { WebscaleProperties } from "../config/properties";
import { LoggerOptions } from "./logger.options";

declare module "../config/properties" {
  interface WebscaleProperties {
    readonly logger: LoggerProperties;
  }
}

export interface LoggerProperties extends LoggerOptions {

  readonly namespaces?: {[namespace: string]: LoggerOptions};

}

