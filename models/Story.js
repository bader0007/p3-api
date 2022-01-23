const mongoose = require("mongoose")
const Joi = require("joi")

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  rating: Number,
})

const storySchema = new mongoose.Schema({
  title: String,
  description: String,
  poster: String,
  ratings: [ratingSchema],
  body: String,
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "Owner",
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  ratingAverage: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Comment",
    },
  ],
  genres: {
    type: mongoose.Types.ObjectId,
    ref: "Genre",
  },

  likes: [
    {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  ],
})

const storyAddJoi = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().min(5).max(1000).required(),
  poster: Joi.string().uri().max(1000).required(),
  body: Joi.string().min(5).required(),
  genres: Joi.Objectid(),
  owner: Joi.Objectid(),
})

const storyEditJoi = Joi.object({
  title: Joi.string().min(1).max(200),
  description: Joi.string().min(5).max(1000),
  poster: Joi.string().uri().max(1000),
  body: Joi.string().min(5),
  genres: Joi.Objectid(),
  owner: Joi.Objectid(),

})

const ratingJoi = Joi.object({
  rating: Joi.number().min(0).max(5).required(),
})

const Story = mongoose.model("Story", storySchema)

module.exports.Story = Story
module.exports.storyAddJoi = storyAddJoi
module.exports.storyEditJoi = storyEditJoi
module.exports.ratingJoi = ratingJoi
