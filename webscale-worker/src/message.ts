
export interface Message<T = any> {

  type: (new () => T);
  call: string;
  args: any[];


}
