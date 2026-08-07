const Joi = require("joi");

const empRegistrationValidation = Joi.object({
  mobile: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required.",
      "string.pattern.base": "Mobile number must be exactly 10 digits.",
    }),

  name: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Name is required.",
    "string.min": "Name must be at least 2 characters.",
    "string.max": "Name must not exceed 100 characters.",
  }),

  address: Joi.string(),

  email: Joi.string(),

  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required.",
    "string.min": "Password must be at least 6 characters.",
  }),
});

const leadValidationSchema = Joi.object({
  lead_mob_no: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.empty": "Mobile number is required.",
      "string.pattern.base": "Mobile number must be 10 digits.",
    }),
  lead_project_id: Joi.number().required().messages({
    "number.base": "Project ID must be a Required.",
    "string.empty": "Project is required.",
  }),

  lead_title: Joi.string().allow("", null).messages({
    "string.empty": "Title is required.",
  }),

  lead_sort_des: Joi.string().max(100).allow("", null).messages({
    "string.max": "Remark must not exceed 100 characters.",
  }),
  lead_cust_name: Joi.string().min(4).max(100).required().messages({
    "string.empty": "Name is required.",
    "string.min": "Name must be at least 4 characters.",
    "string.max": "Name must not exceed 100 characters.",
  }),

  lead_email: Joi.string().allow("", null),

  lead_source: Joi.number().required().messages({
    "number.base": "Lead source must be a Required.",
    "any.required": "Lead source is required.",
  }),
  lead_alter_mob_no: Joi.string().allow("", null),
  lead_assign_to: Joi.string().allow("", null),
  lead_business: Joi.string().required().messages({
    "string.empty": "Business is required.",
  }),
  lead_gender: Joi.string().required().messages({
    "string.empty": "Gender is required.",
  }),
  lead_city: Joi.string().required().messages({
    "string.empty": "City is required.",
  }),
  lead_state: Joi.string().required().messages({
    "string.empty": "State is required.",
  }),
  lead_country: Joi.string().required().messages({
    "string.empty": "Country is required.",
  }),
  lead_bkt_status: Joi.string().allow("", null),
});

module.exports = { empRegistrationValidation, leadValidationSchema };
