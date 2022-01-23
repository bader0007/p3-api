const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const { User, signupJoi, loginJoi, profileJoi, forgotPasswordJoi, resetPasswordJoi } = require("../models/User")
const checkToken = require("../middleware/checkToken")
const checkAdmin = require("../middleware/checkAdmin")
const validateBody = require("../middleware/validateBody")
const checkId = require("../middleware/checkId")
const nodemailer = require("nodemailer")

router.post("/signup", validateBody(signupJoi), async (req, res) => {
  try {
    const { firstName, lastName, email, password, avatar } = req.body

    const userFound = await User.findOne({ email })
    if (userFound) return res.status(400).send("user already registered")

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = new User({
      firstName,
      lastName,
      email,
      password: hash,
      avatar,
      role: "User",
    })

    await user.save()

    delete user._doc.password

    res.json(user)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/add-admin", checkAdmin, validateBody(signupJoi), async (req, res) => {
  try {
    const { firstName, lastName, email, password, avatar } = req.body

    const userFound = await User.findOne({ email })
    if (userFound) return res.status(400).send("user is already admin")

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const user = new User({
      firstName,
      lastName,
      email,
      password: hash,
      avatar,
      role: "Admin",
    })

    await user.save()

    delete user._doc.password

    res.json(user)
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/login", validateBody(loginJoi), async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(404).send("user not found")

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).send("password incorrect")

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "15d" })

    res.send(token)
  } catch (error) {
    res.status(500).json(error.message)
  }
})

router.post("/login/admin", validateBody(loginJoi), async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email, role: "Admin" })
    if (!user) return res.status(404).send("admin not found")

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).send("password incorrect")

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "15d" })

    res.send(token)
  } catch (error) {
    res.status(500).json(error.message)
  }
})

router.post("/forgot-password", validateBody(forgotPasswordJoi), async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(404).send("user not found")

    const transport = nodemailer.createTransport({
      service: "gmail",
      port:587,
      secure: false,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD,
      },
    })

    const token = jwt.sign({ id: user._id, forgotPassword: true }, process.env.JWT_SECRET_KEY, { expiresIn: "15d"})

    await transport.sendMail({
      from: `"testt testt" <${process.env.SENDER_EMAIL}`, //sender address
      to: email, // list to receivers
      subject: "Reset password", //subject line

      html: `Hello, please click on this link to reset your password.
      <a href="http://localhost:3000/reset-password/${token}">Reset password</a>`, // html body
    })

    res.send(" reset password link sent")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.post("/reset-password/:token", validateBody(resetPasswordJoi), async (req, res) => {
  try {
    const decryptedToken = jwt.verify(req.params.token, process.env.JWT_SECRET_KEY)
    if (!decryptedToken.forgotPassword) return res.status(403).send("unauthorized action") 
    const userId = decryptedToken.id
    const user = await User.findById(userId)
    if (!user) return res.status(404).send("user not found")

    const { password } = req.body
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    await User.findByIdAndUpdate(userId, { $set: { password: hash }})

    res.send ("password reset")
  } catch (error) {
    res.status(500).send(error.message)
  }
})

router.get("/users", checkAdmin, async (req, res) => {
  const user = await User.find().select("-__v -password")
  res.json(user)
})

router.get("/profile", checkToken, async (req, res) => {
  const user = await User.findById(req.userId).select("-__v -password").populate("stories").populate("likes")
  res.json(user)
})

router.put("/profile", checkToken, validateBody, async (req, res) => {
  const { firstName, lastName, password, avatar } = req.body

  let hash
  if (password) {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
  }
  const user = await User.findByIdAndUpdate(
    req.userId,
    { $set: { firstName, lastName, password: hash, avatar } },
    { new: true }
  ).select("-__v -password")

  res.json(user)
})

router.delete("/users/:id", checkAdmin, checkId, async (req, res) => {
  try {
    const user = await User.findByIdAndRemove(req.params.id)
    if (!user) return res.status(404).send("user not found")

    res.json("user deleted successfully")
  } catch (error) {
    res.status(500).send(error)
  }
})

module.exports = router
