import { Collection } from "../collection";
import { Context } from "../models/context";
import { Connection } from "./connection";
import { Datasource } from "./datasource";

export class SimpleDatasource extends Datasource {

  constructor(name: string, private connection: Connection<any>) {
    super(name);
  }

  public getConnection<C>(collection: Collection<any>, context?: Context): Connection<C> {
    return this.connection;
  }

}