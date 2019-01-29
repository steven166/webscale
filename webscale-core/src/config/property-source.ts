import { EnvPropertySource } from "./env.property-source";
import { FilePropertySource } from "./file.property-source";
import { ObjectPropertySource } from "./object.property-source";

export abstract class PropertySource {

  /**
   * Create property source from an object or parse from a string
   * @param object
   * @return {PropertySource}
   */
  public static from(object: any): PropertySource {
    if (typeof(object) === "string") {
      try {
        return PropertySource.fromJson(object);
      } catch (e) {
        try {
          return PropertySource.fromYaml(object);
        } catch (ee) {
          throw new Error(`Unable to parse property source: ${ee.message}`);
        }
      }
    }
    return new ObjectPropertySource(object);
  }

  /**
   * Create property source from a yaml string
   * @param {string} yamlString
   * @return {PropertySource}
   */
  public static fromYaml(yamlString: string): PropertySource {
    const yaml = require("yamljs");
    return new ObjectPropertySource(yaml.parse(yamlString));
  }

  /**
   * Create property source from a json string
   * @param {string} jsonString
   * @return {PropertySource}
   */
  public static fromJson(jsonString: string): PropertySource {
    return new ObjectPropertySource(JSON.parse(jsonString));
  }

  /**
   * Create property source from a file
   * @param {string} file
   * @return {PropertySource}
   */
  public static fromFile(file: string): PropertySource {
    return new FilePropertySource(file);
  }

  /**
   * Create property source from environments variables
   */
  public static fromEnv(): PropertySource {
    return new EnvPropertySource();
  }

  /**
   * Load source as object
   * @returns {Promise<void>}
   */
  public abstract load(): Promise<any>;

}
