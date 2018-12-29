
import { App, Module } from "@webscale/core";

export class CollectionModule implements Module {

  public readonly name: string = "collection";

  public async load(app: App): Promise<void> {
    // nothing todo
  }

}