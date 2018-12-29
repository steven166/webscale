
export interface DatasourceEvent<T> {

  id: string;
  collection: string;
  type: DatasourceEventType;
  before?: T;
  after?: T;

}

export enum DatasourceEventType {

  CREATED = "CREATED",
  UPDATED = "UPDATED",
  DELETED = "DELETED"

}
