import Joi from 'joi';

export const userSchemaReg = Joi.object({
  email:Joi.string().email().required(),
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
});

export const userSchemaLog = Joi.object({
  email:Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});
