import { Ids } from "./ids";

export class CollectionEvent<T> {

  type: CollectionEventType;
  collection: string;
  name: string;
  ids: Ids;
  before: T;
  after: T;

}

export enum CollectionEventType {

  CREATED = "CREATED",
  UPDATED = "UPDATED",
  DELETED = "DELETED"

}
