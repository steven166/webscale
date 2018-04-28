import { App, Module } from "../module";
import { PropertySource } from "./property-source";
import { Config } from "./config";

/**
 * Config module
 */
export class ConfigModule implements Module {

  public readonly name = "config";

  constructor(private readonly propertySources?: Array<PropertySource | ((config: Config) => PropertySource)>) {
  }

  public async load(app: App): Promise<void> {
    app.config = await new Config(this.propertySources || []).load();
  }
}