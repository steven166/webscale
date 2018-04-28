import { App, Module } from "../module";
import { Logger } from "./logger";
import { LogHandler } from "./handlers";

export class LoggerModule implements Module {

  public readonly name = "logger";

  constructor(private readonly options?: LoggerModuleOptions) {

  }

  public async load(app: App): Promise<void> {
    if (this.options) {
      if (this.options.handler) {
        Logger.
      }
    }
    if (app.config) {
      Logger.configure(app.config.webscale.logger);
    }
  }

}

export interface LoggerModuleOptions {
  handler?: LogHandler;
}
