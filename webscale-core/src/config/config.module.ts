import { App, Module } from "../module";
import { Config } from "./config";
import { ConfigProperties } from "./config.properties";

/**
 * Config module
 */
export class ConfigModule implements Module {

  public readonly name = "config";

  constructor(private readonly configProperties?: ConfigProperties) {
  }

  public async load(app: App): Promise<void> {
    app.config = await new Config(this.configProperties && this.configProperties.sources || []).load();
  }
}
