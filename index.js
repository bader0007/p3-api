const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config
const Joi = require("joi")
const JoiObjectId = require("joi-objectid")
Joi.Objectid = JoiObjectId(Joi)
const users = require("./routes/users")
const owners = require("./routes/owners")
const genres = require("./routes/geners")
const stories = require("./routes/stories")
mongoose
  .connect(`mongodb://localhost:27017/storiesDB`)
  .then(() => {
    console.log("connected to mongoDB")
  })
  .catch(error => {
    console.log("failed to connect to mongoDB"), error
  })

const app = express()
app.use(express.json())
app.use(cors())

app.use("/api/auth", users)
app.use("/api/owners", owners)
app.use("/api/genres", genres)
app.use("/api/stories", stories)


const port = process.env.PORT || 5000

app.listen(port, () => console.log("server is listening on port " + port))
