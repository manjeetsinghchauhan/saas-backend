import { Request, ResponseToolkit } from '@hapi/hapi';
import Joi from 'joi';

/**
 * Factory function to create validation middleware for different schemas
 * @param schema - Joi validation schema
 * @param target - What to validate ('payload', 'query', 'params', 'headers')
 * @returns Hapi validation configuration object
 */
export function createValidation(schema: Joi.Schema, target: 'payload' | 'query' | 'params' | 'headers' = 'payload') {
  return {
    [target]: schema,
    failAction: (request: Request, h: ResponseToolkit, err: any) => {
      const error = err.output.payload;
      return h.response({
        success: false,
        message: 'Validation failed',
        errors: error.message
      }).code(400).takeover();
    }
  };
}

/**
 * Factory function to create validation for multiple targets
 * @param validations - Object with target keys and Joi schemas
 * @returns Hapi validation configuration object
 */
export function createMultiValidation(validations: {
  payload?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
  headers?: Joi.Schema;
}) {
  const result: any = {};
  
  Object.entries(validations).forEach(([target, schema]) => {
    if (schema) {
      result[target] = schema;
    }
  });
  
  result.failAction = (request: Request, h: ResponseToolkit, err: any) => {
    const error = err.output.payload;
    return h.response({
      success: false,
      message: 'Validation failed',
      errors: error.message
    }).code(400).takeover();
  };
  
  return result;
} 