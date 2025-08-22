const { generatePropertyDescription } = require("../utils/openaiLogic");

const createPropertyWithAI = async (req, res) => {
  try {
    const propertyData = req.body;
    console.log(propertyData);
    // Call AI agent
    const aiDescription = await generatePropertyDescription(propertyData);

    // Merge description
    propertyData.description = aiDescription;

    // Save property to DB
    // const property = new Property(propertyData);
    // await property.save();

    res.status(201).json({
      success: true,
      message: "Property created with AI description",
      data: aiDescription
    });
  } catch (error) {
    console.error("Error creating property:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports={createPropertyWithAI}