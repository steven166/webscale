export const BOOT_TIME = Date.now();

import { Config } from "../config";
import { Logger } from "../logger";
import { Module } from "./module";

const logger = Logger.create("@winston/app");

export class App {

  public config: Config;
  public attributes: { [name: string]: any };
  private modules: Module[] = [];

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
