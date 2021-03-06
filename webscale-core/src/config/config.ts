import { ObjectUtils } from "../utils/object.utils";
import { PropertySource } from "./property-source";
import { PropertySources } from "./property-sources";

export class Config extends PropertySource {

  public static init(propertySources: Array<PropertySource | ((config: Config) => PropertySource)>): Config {
    return new Config(propertySources);
  }

  /**
   * Get property
   * @param {string} property
   * @param {T} defaultValue
   * @returns {T | undefined}
   */
  public static get<T>(property: string, defaultValue?: T): T | undefined {
    if (!Config.instance) {
      throw new Error(`Config is not initialized`);
    }
    return Config.instance.get<T>(property, defaultValue);
  }

  private static instance: Config;
  // tslint:disable-next-line
  private __source: any;

  constructor(private readonly propertySources: Array<PropertySource | ((config: Config) => PropertySource)>) {
    super();
    Config.instance = this;
  }

  /**
   * Get property
   * @param {string} property
   * @param {T} defaultValue
   * @returns {T | undefined}
   */
  public get<T>(property: string, defaultValue?: T): T | undefined {
    let result = this.getFromObject(this.__source, property) || undefined;
    if (result === undefined && defaultValue !== undefined) {
      result = defaultValue;
    }
    return result;
  }

  /**
   * Load sources
   * @returns {Promise<void>}
   */
  public async load(): Promise<Config> {
    if (this.__source) {
      throw new Error(`Config already loaded`);
    }
    let combinedSources = {};
    for (let propertySource of this.propertySources) {
      if (propertySource) {
        if (typeof(propertySource) === "function") {
          propertySource = propertySource(this);
        } else if (!(propertySource instanceof PropertySource)) {
          propertySource = PropertySources.from(propertySource);
        }
        let source = await propertySource.load();
        ObjectUtils.deepMerge(combinedSources, source);
      }
    }

    for (let property in combinedSources) {
      if (combinedSources[property] && this[property] === undefined) {
        Object.defineProperty(this, property, { get: () => combinedSources[property] });
      }
    }
    ObjectUtils.deepFreeze(combinedSources);
    this.__source = combinedSources;
    return this;
  }

  /**
   * Get property from nexted object
   * @param object
   * @param {string} property
   * @returns {any}
   */
  protected getFromObject(object: any, property: string): any {
    let segments = property.split("\\.");
    let scope = object;
    for (let segment of segments) {
      if (!scope) {
        return undefined;
      }
      scope = scope[segment];
    }
    return scope;
  }

}
