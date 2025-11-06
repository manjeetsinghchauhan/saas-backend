import Joi from 'joi';

// User registration schema (static messages)
export const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'any.required': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'string.empty': 'Name cannot be empty'
    }),
  roleId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Role ID is required',
      'number.base': 'Role ID must be a number',
      'number.integer': 'Role ID must be an integer',
      'number.positive': 'Role ID must be a positive number'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'any.required': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email cannot be empty',
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'any.required': 'Password is required',
      'string.min': 'Password must be at least 6 characters long',
      'string.empty': 'Password cannot be empty',
    }),
});

// User login schema (static messages)
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'any.required': 'Email is required',
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email cannot be empty',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required',
      'string.empty': 'Password cannot be empty',
    }),
}); 