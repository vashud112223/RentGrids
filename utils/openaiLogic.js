// utils/openaiLogic.js
const client = require("../configuration/openaiClient");

async function generatePropertyDescription(propertyData) {
  if (!propertyData || Object.keys(propertyData).length === 0) {
    throw new Error("Property details are required");
  }

  const systemPrompt = `
    You are a real estate content writer.
    Generate a professional and appealing description for a rental property.
    Keep it between 120–180 words and highlight unique features.
  `;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Here are the property details: ${JSON.stringify(propertyData)}`
      }
    ]
  });

  return response.choices[0].message.content.trim();
}

module.exports = { generatePropertyDescription };
