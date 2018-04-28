import { Config } from "../config";

export const BOOT_TIME = Date.now();
import { Module } from "./module";
import { ConsoleLogHandler } from "../logger/handlers";
import { LoggerModule } from "../logger/logger.module";
import { ConfigModule } from "../config/config.module";

export class App {

  private modules: Module[] = [];
  public config: Config;

  public load(module: Module): App {
    this.modules.push(module);
    return this;
  }

  public startup(callback?: ((e: any|undefined, app: App) => void | Promise<void>)): Promise<App> {
    return new Promise<App>((resolve, reject) => {

    });
  }

}

let app = new App();
app.load(new ConfigModule([

]));
app.load(new LoggerModule({
  handler: ConsoleLogHandler
}));

app.startup(async () => {

}).catch(e => {
  process.exit(1);
});

