const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const dotenv = require("dotenv")
dotenv.config();



const app = express();

app.use(cors());
app.use(express.json());


// HARD-CODED KEY (API approval)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// TEST ROUTE
app.post("/analyze", async (req, res) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
     messages: [
  {
    role: "system",
    content: `
You are an AI-native food ingredient copilot.

Your task:
- Help users understand food ingredient trade-offs at decision time.
- Explain ingredients in simple, neutral language.
- Be honest about uncertainty.
- Do NOT give medical advice or diagnoses.

Output rules:
- Respond ONLY in valid JSON.
- Return ALL five keys:
  whatMatters,
  whyItMatters,
  tradeOffs,
  uncertainty,
  decision
- Each value must be a single concise string.

Calibration:
- Do not exaggerate risks for whole or minimally processed foods.
- Mention risks only if widely accepted and context-independent.
- Avoid fear-based language.
- If confidence is low, state that clearly.

If input has fewer than 3 ingredients or only whole foods,
prefer reassurance over warnings.
`
  },
  {
    role: "user",
    content: req.body.text
  }
]

    });

   const raw = completion.choices[0].message.content;
    const match = raw.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(match[0]);

    // SENDED TO FRONTEND
    res.json(parsed);

  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({
      whatMatters: "AI failed to generate a response.",
      whyItMatters: "The system could not process the input.",
      tradeOffs: "None.",
      uncertainty: "High.",
      decision: "Please try again."
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT , () => {
  console.log("Server running on port", PORT);});
