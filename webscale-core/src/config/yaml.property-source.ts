import { PropertySource } from "./property-source";
import * as yaml from "yamljs";

/**
 * Property source from a YAML file
 */
export class YamlPropertySource extends PropertySource {

  constructor(private file: string) {
    super();
  }

  /**
   * Load yaml file
   * @returns {Promise<void>}
   */
  public load(): Promise<PropertySource> {
    return import("fs").then(fs => {
      return new Promise<PropertySource>((resolve, reject) => {
        fs.readFile(this.file, (err, data) => {
          if (err) {
            resolve(this);
          } else {
            try {
              let source = yaml.parse(data.toString());
              resolve(source);
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    });
  }
}
