import { Context } from "../models/context";
import { Connection } from "./connection";
import { Collection } from "../collection";

export abstract class Datasource {

  constructor(public readonly name) {
  }

  public abstract getConnection<C>(collection: Collection<any>, context?: Context): Connection<C>;

}
