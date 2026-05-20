// Schema validation disabled — AJV removed, awaiting CSP-compliant replacement.
// import Ajv, { ErrorObject } from 'ajv';
// import schema from '../../schemas/calculation.schema.json';
import { Injectable } from '@angular/core';
import { ValidationError } from '../../model';

@Injectable({ providedIn: 'root' })
export class SchemaValidatorService {
  // private readonly ajvValidate = new Ajv({ allErrors: true }).compile(schema);

  validate(_data: unknown): ValidationError[] {
    return [];
    // if (this.ajvValidate(data)) return [];
    // return (this.ajvValidate.errors ?? []).map(toValidationError);
  }
}

// function toValidationError(error: ErrorObject): ValidationError {
//   const pointer =
//     error.keyword === 'required'
//       ? `${error.instancePath}/${(error.params as { missingProperty: string }).missingProperty}`
//       : error.instancePath;
//   return { path: jsonPointerToDot(pointer), message: error.message ?? '' };
// }
//
// function jsonPointerToDot(pointer: string): string {
//   if (!pointer) return '';
//   return pointer
//     .slice(1)
//     .split('/')
//     .map((s) => (/^\d+$/.test(s) ? `[${s}]` : s))
//     .join('.')
//     .replace(/\.\[/g, '[');
// }
