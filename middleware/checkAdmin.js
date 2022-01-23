const jwt = require("jsonwebtoken")
const { User } = require("../models/User")
const checkAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization")
    if (!token) return res.status(401).send("token is missing")

    const decryptedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
    const userId = decryptedToken.id

    const adminFound = await User.findById(userId)
    if (!adminFound) return res.status(404).send("user not found")

    if (adminFound.role !== "Admin") return res.status(403).send("you are not an admin")
    next()
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
}

module.exports = checkAdmin
