import { Worker} from "./worker";

let worker = new Worker({
  threads: 4,

});


class MyClass {

  public doStuff(): Promise<void> {
    return Promise.resolve();
  }

}

let w = new Worker().init(MyClass);
w.doStuff();

new Wo