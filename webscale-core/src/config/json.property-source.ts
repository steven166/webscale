import { PropertySource } from "./property-source";

/**
 * Property source from a JSON file
 */
export class JsonPropertySource extends PropertySource {

  constructor(private file: string) {
    super();
  }

  /**
   * Load json file
   * @returns {Promise<void>}
   */
  public load(): Promise<any> {
    return import("fs").then(fs => {
      return new Promise<PropertySource>((resolve, reject) => {
        fs.readFile(this.file, (err, data) => {
          if (err) {
            resolve(this);
          } else {
            try {
              let source = JSON.parse(data.toString());
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
