export abstract class PropertySource {

  /**
   * Load source as object
   * @returns {Promise<void>}
   */
  public abstract load(): Promise<any>;

}
