const mongoose = require('mongoose')
const connectDb = async() => {
    console.log(process.env.MONGO_URI)
  await mongoose.connect(process.env.MONGO_URI)
}

module.exports ={connectDb};