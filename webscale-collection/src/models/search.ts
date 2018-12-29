export interface Search {

  query?: Filter;
  includes?: string[];

}

export type Filter = { [key: string]: any };