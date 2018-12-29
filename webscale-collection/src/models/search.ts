export interface Search {

  query?: Filter;
  includes?: string[];

}

export interface Filter {
  [key: string]: any;
}