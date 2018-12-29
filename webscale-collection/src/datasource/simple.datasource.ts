import { Datasource } from "./datasource";
import { Connection } from "./connection";
import { Context } from "../models/context";
import { Collection } from "../collection";

export class SimpleDatasource extends Datasource {

  constructor(name: string, private connection: Connection<any>) {
    super(name);
  }


  public getConnection<C>(collection: Collection<any>, context?: Context): Connection<C> {
    return this.connection;
  }

}