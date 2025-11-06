import Joi from 'joi';

export const createOrganizationSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'any.required': 'Organization name is required',
      'string.min': 'Organization name must be at least 3 characters',
      'string.max': 'Organization name cannot exceed 100 characters',
      'string.empty': 'Organization name cannot be empty'
    }),
  ownerName: Joi.string()
    .optional(),
  domain: Joi.string()
    .trim()
    .min(3)
    .max(255)
    .required()
    .messages({
      'any.required': 'Domain is required',
      'string.min': 'Domain must be at least 3 characters',
      'string.max': 'Domain cannot exceed 255 characters',
      'string.empty': 'Domain cannot be empty'
    }),
  region: Joi.string()
    .valid('us-east-1', 'eu-west-1', 'ap-south-1')
    .default('us-east-1')
    .messages({
      'any.only': 'Region must be one of us-east-1, eu-west-1, ap-south-1'
    }),
  timezone: Joi.string()
    .default('UTC')
    .messages({})
})
.example({
  name: 'Acme Inc',
  ownerName: 'Jane Doe',
  domain: 'acme.com',
  region: 'us-east-1',
  timezone: 'America/Los_Angeles'
}); 