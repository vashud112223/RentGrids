const express = require("express");
const {createPropertyWithAI}=require("../controllers/openaiController")
const openairouter=express.Router();

openairouter.post("/openai/description", createPropertyWithAI);
module.exports={openairouter};