import { HttpError, ValidationMessage } from "./http.error";

export class BadRequestError extends HttpError {

  constructor(message: string, validationErrors?: ValidationMessage[]) {
    super(message, 400, validationErrors);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

}
