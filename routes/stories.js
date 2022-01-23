const express = require("express")
const checkAdmin = require("../middleware/checkAdmin")
const checkId = require("../middleware/checkId")
const checkToken = require("../middleware/checkToken")
const validateBody = require("../middleware/validateBody")
const validateId = require("../middleware/validateId")
const { Story, storyAddJoi, storyEditJoi, ratingJoi } = require("../models/Story")
const { commentJoi, Comment } = require("../models/Comment")
const { Owner } = require("../models/Owner")
const { Genre } = require("../models/Genre")
const { User } = require("../models/User")
const router = express.Router()

/* stories */

router.get("/", async (req, res) => {
  const stories = await Story.find()
  .populate("genres")
  .populate("owner")
  .populate({
    path: "comments",
    populate: {
      path: "owner",
    },
  })
  res.json(stories)
})

router.get("/:id", checkId, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)

      .populate("genres")
      .populate({
        path: "comments",
        populate: {
          path: "owner",
          select: "-password -email -likes -role",
        },
      })
    if (!story) return res.status(404).send("story not found")

    res.json(story)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.post("/", checkToken, validateBody(storyAddJoi), async (req, res) => {
  try {
    const { title, description, poster, body, genres, owner } = req.body

    const story = new Story({
      title,
      description,
      poster,
      body,
      genres,
      owner,
      user: req.userId
    })

    await story.save()
    await User.findByIdAndUpdate(req.userId, { $push: { stories: story._id } })
    await Owner.findByIdAndUpdate(owner, { $push: { stories: story._id } })


    res.json(story)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.put("/:id", checkToken, checkId, validateBody(storyEditJoi), async (req, res) => {
  try {
    const { title, description, poster, body, genres, owner } = req.body

    let story = await Story.findById(req.params.id)
    if (!story) return res.status(404).send("story not found")

    const user = await User.findById(req.userId)

    if (user.role !== "Admin" && story.user != req.userId) return res.status(403).send("unauthorized action")

    await Owner.findByIdAndUpdate(story.owner, { $pull: { stories: story._id } })
    story = await Story.findByIdAndUpdate(
      req.params.id,
      { $set: { title, description, poster, body, genres, owner } },
      { new: true }
      )
      
    await Owner.findByIdAndUpdate(owner, { $push: { stories: story._id } })

    res.json(story)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.delete("/:id", checkAdmin, checkId, async (req, res) => {
  try {
    await Comment.deleteMany({ storyId: req.params.id })

    const story = await Story.findByIdAndRemove(req.params.id)
    if (!story) return res.status(404).send("story not found")

    await User.findByIdAndUpdate(story.user, { $pull: { stories: story._id } })
    await Owner.findByIdAndUpdate(story.owner, { $pull: { stories: story._id } })



    res.send("story deleted successfully")
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

/* Comment */

router.get("/:storyId/comments", validateId("storyId"), async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId)
    if (!story) return res.status(404).send("story is not found")

    const comments = await Comment.find({ storyId: req.params.storyId })
    res.json(comments)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.post("/:storyId/comments", checkToken, validateId("storyId"), validateBody(commentJoi), async (req, res) => {
  try {
    const { comment } = req.body

    const story = await Story.findById(req.params.storyId)
    if (!story) return res.status(404).send("story not found")

    const newComment = new Comment({ comment, owner: req.userId, storyId: req.params.storyId })

    await Story.findByIdAndUpdate(req.params.storyId, { $push: { comments: newComment._id } })

    await newComment.save()

    res.json(newComment)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.put(
  "/:storyId/comments/:commentId",
  checkToken,
  validateId("storyId", "commentId"),
  validateBody(commentJoi),
  async (req, res) => {
    try {
      const story = await Story.findById(req.params.storyId)
      if (!story) return res.status(404).send("story not found")
      const { comment } = req.body

      const commentFound = await Comment.findById(req.params.commentId)
      if (!commentFound) return res.status(404).send("comment not found")

      if (story.owner != req.userId) return res.status(403).send("unauthorized action")

      const updatedComment = await Comment.findByIdAndUpdate(req.params.commentId, { $set: { comment } }, { new: true })

      await updatedComment.save()

      res.json(updatedComment)
    } catch (error) {
      console.log(error)
      res.status(500).send(error.message)
    }
  }
)

router.delete(
  "/:storyId/comments/:commentId",
  checkToken,
  validateId("storyId", "commentId"),
  validateBody(commentJoi),
  async (req, res) => {
    try {
      const story = await Story.findById(req.params.storyId)
      if (!story) return res.status(404).send("story not found")
      const { comment } = req.body

      const commentFound = await Comment.findById(req.params.commentId)
      if (!commentFound) return res.status(404).send("comment not found")

      const user = await User.findById(req.userId)

      if (user.role !== "Admin" && commentFound.owner != req.userId) return res.status(403).send("unauthorized action")

      await Story.findByIdAndUpdate(req.params.storyId, { $pull: { comments: commentFound._id } })

      await Comment.findByIdAndRemove(req.params.commentId)

      res.send("comment is removed")
    } catch (error) {
      console.log(error)
      res.status(500).send(error.message)
    }
  }
)

/* Rating */

router.post("/:storyId/ratings", checkToken, validateId("storyId"), validateBody(ratingJoi), async (req, res) => {
  try {
    let story = await Story.findById(req.params.storyId)
    if (!story) return res.status(404).send("story not found")

    const { rating } = req.body

    const newRating = {
      rating,
      userId: req.userId,
    }

    const ratingFound = story.ratings.find(ratingObject => ratingObject.userId == req.userId)
    if (ratingFound) return res.status(400).send("user already rated this story")

    story = await Story.findByIdAndUpdate(req.params.storyId, { $push: { ratings: newRating } }, { new: true })

    let ratingSum = 0
    story.ratings.forEach(ratingObject => {
      ratingSum += ratingObject.rating
    })
    const ratingAverage = ratingSum / story.ratings.length

    await Story.findByIdAndUpdate(req.params.storyId, { $set: { ratingAverage } })
    res.send("rating added")
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

/* Likes */

router.get("/:storyId/likes", checkToken, validateId("storyId"), async (req, res) => {
  try {
    let story = await Story.findById(req.params.storyId)
    if (!story) return res.status(404).send("story not found")

    const userFound = story.likes.find(like => like == req.userId)
    if (userFound) {
      await Story.findByIdAndUpdate(req.params.storyId, { $pull: { likes: req.userId } })
      await User.findByIdAndUpdate(req.userId, { $pull: { likes: story._id } })
      res.send("removed like from story")
    } else {
      await Story.findByIdAndUpdate(req.params.storyId, { $push: { likes: req.userId } })
      await User.findByIdAndUpdate(req.userId, { $push: { likes: story._id } })
      res.send("story liked")
    }
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

module.exports = router
