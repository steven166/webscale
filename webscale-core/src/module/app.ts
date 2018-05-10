export const BOOT_TIME = Date.now();

import {Config, PropertySource} from "../config";
import {Module} from "./module";
import {LoggerModule} from "../logger/logger.module";
import {ConfigModule} from "../config/config.module";
import {Logger, LogLevel} from "../logger";

const logger = Logger.create("@winston/app");

export class App {

  private modules: Module[] = [];
  public config: Config;

  public load(module: Module): App {
    this.modules.push(module);
    return this;
  }

  public startup(): Promise<App> {
    return (async () => {
      for (let module of this.modules) {
        logger.verbose(`Load module: ${module.name}`);
        await module.load(this);
      }
      let startupTime = Date.now() - BOOT_TIME;
      logger.info(`Started up in ${startupTime}ms`);

      return this;
    })();
  }

}

let app = new App();
app.load(new ConfigModule({
  sources: [
    PropertySource.fromFile("application.yml")
  ]
}));
app.load(new LoggerModule({
  level: LogLevel.SILLY,
  handlers: ["console"]
}));

app.startup().then(async () => {

}).catch(e => {
  process.exit(1);
});

