const mongoose = require("mongoose")
const Joi = require("joi")

const ownerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  stories: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Story",
    },
  ],
  
  photo: String,
  type: {
    type: String,
    enum: ["Owner"],
  },
})

const ownerAddJoi = Joi.object({
  firstName: Joi.string().min(2).max(100).required(),
  lastName: Joi.string().min(2).max(100).required(),
  stories: Joi.array().items(Joi.Objectid()),
  photo: Joi.string().uri(),
  type: Joi.string().valid("Owner").required(),
})

const ownerEditJoi = Joi.object({
  firstName: Joi.string().min(2).max(100),
  lastName: Joi.string().min(2).max(100),
  stories: Joi.array().items(Joi.Objectid()),
  photo: Joi.string().uri(),
  type: Joi.string().valid("Owner"),
})

const Owner = mongoose.model("Owner", ownerSchema)
module.exports.Owner = Owner
module.exports.ownerAddJoi = ownerAddJoi
module.exports.ownerEditJoi = ownerEditJoi
