import Joi from 'joi';

const password = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .messages({
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    'string.min': 'Password must be at least 8 characters',
  });

export const registerSchema = Joi.object({
  name:            Joi.string().trim().min(2).max(100).required(),
  email:           Joi.string().trim().email().lowercase().required(),
  password:        password.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
  role: Joi.string().valid('user', 'admin').default('user'),
});

export const loginSchema = Joi.object({
  email:    Joi.string().trim().email().lowercase().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
});

export const resetPasswordSchema = Joi.object({
  password:        password.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     password.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({ 'any.only': 'Passwords do not match' }),
});
