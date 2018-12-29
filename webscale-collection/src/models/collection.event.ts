import { Ids } from "./ids";

export class CollectionEvent<T> {

  public type: CollectionEventType;
  public collection: string;
  public name: string;
  public ids: Ids;
  public before: T;
  public after: T;

}

export enum CollectionEventType {

  CREATED = "CREATED",
  UPDATED = "UPDATED",
  DELETED = "DELETED"

}
