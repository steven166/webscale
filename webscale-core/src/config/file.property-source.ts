import { PropertySource } from "./property-source";

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
    return import("fs").then(fs => {
      return new Promise<PropertySource>((resolve, reject) => {
        fs.readFile(this.file, (err, data) => {
          if (err) {
            resolve(this);
          } else {
            try {
              resolve(PropertySource.from(data.toString()));
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    });
  }
}
