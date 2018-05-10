import {App, Module} from "../module";
import {Logger} from "./logger";
import {LoggerProperties} from "./logger.properties";

export class LoggerModule implements Module {

  public readonly name = "logger";

  constructor(private properties?: LoggerProperties) {

  }

  public async load(app: App): Promise<void> {
    if (this.properties) {
      Logger.configure(this.properties);
    } else if (app.config) {
      Logger.configure(app.config.webscale.logger);
    }
  }

}
