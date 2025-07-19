import Joi from 'joi';

export const dispSchemaReg = Joi.array().items(
    Joi.object({
        date: Joi.string().isoDate().required(),
        heure_debut: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
        heure_fin: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
    })
)