import Joi from 'joi';

export const clientSchemaReg = Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().min(3).max(30).required(),
    id:Joi.number().required()
});

// export const clientSchemaLog = Joi.object({
//     email: Joi.string().email().required(),
//     password: Joi.string().min(6).required(),
// });