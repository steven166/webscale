import { PropertySource } from "./property-source";

/**
 * PropertySource based on an object structure
 */
export class ObjectPropertySource extends PropertySource {

  constructor(private source: any) {
    super();
  }

  /**
   * Do nothing
   * @returns {Promise<void>}
   */
  public load(): Promise<PropertySource> {
    return Promise.resolve(this.source);
  }

}
