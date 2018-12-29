import { HttpError } from "./http.error";

export class MethodNotAllowedError extends HttpError {

  constructor(message: string) {
    super(message, 405);
    Object.setPrototypeOf(this, MethodNotAllowedError.prototype);
  }

}