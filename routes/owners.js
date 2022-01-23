const express = require("express")
const checkAdmin = require("../middleware/checkAdmin")
const checkId = require("../middleware/checkId")
const validateBody = require("../middleware/validateBody")
const router = express.Router()
const { Owner, ownerAddJoi, ownerEditJoi } = require("../models/Owner")

router.get("/", async (req, res) => {
  const owners = await Owner.find().populate("stories")
  res.json(owners)
})


router.post("/", checkAdmin, validateBody(ownerAddJoi), async (req, res) => {
  try {
    const { firstName, lastName, photo, type, stories } = req.body

    const owner = new Owner({
      firstName,
      lastName,
      photo,
      type,
      stories,
    })
    await owner.save()

    res.json(owner)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.put("/:id", checkAdmin, checkId, validateBody(ownerEditJoi), async (req, res) => {
  try {
    const { firstName, lastName, photo, type, stories } = req.body

    const owner = await Owner.findByIdAndUpdate(
      req.params.id,
      { $set: { firstName, lastName, photo, type, stories } },
      { new: true }
    )
    if (!owner) return res.status(404).send("owner not found")

    res.json(owner)
  } catch (error) {
    res.status(500).send(error)
  }
})

router.delete("/:id", checkAdmin, checkId, async (req, res) => {
  try {
    const owner = await Owner.findByIdAndRemove(req.params.id)
    if (!owner) return res.status(404).send("owner not found")

    res.json("owner deleted successfully")
  } catch (error) {
    res.status(500).send(error)
  }
})

module.exports = router
