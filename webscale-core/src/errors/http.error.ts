/**
 * Http Error
 */
export class HttpError extends Error {

  private _statusCode: number;
  private _validationErrors: ValidationMessage[];

  constructor(message: string, statusCode: number, validationErrors?: ValidationMessage[]){
    super(message);
    Object.setPrototypeOf(this, HttpError.prototype);
    this._statusCode = statusCode;
    this._validationErrors = validationErrors;
  }

  get statusCode(): number {
    return this._statusCode;
  }

  get validationErrors(): ValidationMessage[] {
    return this._validationErrors;
  }
}

export interface ValidationMessage {
  message: string;
  field: string;
  data: any;
}
