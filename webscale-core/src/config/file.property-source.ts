import { PropertySource } from "./property-source";
import { PropertySources } from "./property-sources";

/**
 * Property source from a file
 */
export class FilePropertySource extends PropertySource {

  constructor(private file: string) {
    super();
  }

  /**
   * Load and parse file
   * @returns {Promise<void>}
   */
  public load(): Promise<PropertySource> {
    const fs = require("fs");
    return new Promise<PropertySource>((resolve, reject) => {
      fs.readFile(this.file, (err, data) => {
        if (err) {
          resolve({} as any);
        } else {
          try {
            resolve(PropertySources.from(data.toString()).load());
          } catch (e) {
            reject(e);
          }
        }
      });
    });
  }
}
