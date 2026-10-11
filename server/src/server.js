import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import buildEmailHtml from "../src/utils/buildEmailHtml.js";
import buildPrompt from "../src/utils/promptBuilder.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

/* ── Start Server ─────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ── Gemini Setup ─────────────────────────────────────────────────────── */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ── Nodemailer Setup ─────────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ── Gemini Model Fallback ──────────────────────────────────────────────
   Try models in order. Return the first one that succeeds.
   Each attempt sends the same prompt + PDF to Gemini.                  */
async function generateWithFallback(prompt, pdfBuffer) {
  const models = ["models/gemini-3.8-flash", "models/gemini-3.5-flash-lite"];
  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`Trying Gemini model: ${modelName} ...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBuffer.toString("base64"),
          },
        },
      ]);

      const text = result.response.text();
      console.log(`Model ${modelName} succeeded.`);
      return text;
    } catch (err) {
      console.warn(`Model ${modelName} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed.");
}

/* ── API Route ────────────────────────────────────────────────────────── */
app.post("/api/submit-assessment", async (req, res) => {
  const { studentName, email, school, questions, answers } = req.body;

  // ── Validation ──
  if (
    !studentName ||
    !email ||
    !school ||
    !Array.isArray(questions) ||
    !Array.isArray(answers)
  ) {
    return res.status(400).json({
      error: "Missing or invalid required fields.",
    });
  }

  if (questions.length !== answers.length) {
    return res.status(400).json({
      error: "Questions and answers length mismatch.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: "Invalid email address.",
    });
  }

  try {
    // ── Step 1: Build prompt & read PDF ──
    const prompt = buildPrompt(questions, answers);
    const pdfPath = path.join(__dirname, "../files/assessment.pdf");
    const pdfBuffer = await fs.readFile(pdfPath);

    // ── Step 2: Try Gemini with fallback ──
    const rawText = await generateWithFallback(prompt, pdfBuffer);

    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      const cleaned = rawText
        .replace(/```json\s*/g, "")
        .replace(/```/g, "")
        .trim();
      analysis = JSON.parse(cleaned);
    }

    // ── Step 3: Build and send email ──
    const emailHtml = buildEmailHtml(
      studentName,
      school,
      analysis,
      questions,
      answers,
    );

    const score = Number(analysis.overallScore);

    const resultLabel =
      score >= 80
        ? "Excellent"
        : score >= 60
          ? "Good"
          : score >= 40
            ? "Needs Improvement"
            : "Requires Attention";

    await transporter.sendMail({
      from: `"Writing Assessment System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Writing Assessment Results — ${resultLabel}`,
      html: emailHtml,
    });

    await transporter.sendMail({
      from: `"Writing Assessment System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `Your Writing Assessment Results — ${resultLabel}`,
      html: emailHtml,
    });

    // ── Step 4: Respond to client ──
    return res.status(200).json({
      success: true,
      message: "Assessment submitted. Results have been sent to your email.",
      overallScore: analysis.overallScore,
    });
  } catch (err) {
    console.error("Assessment error:", err);

    return res.status(500).json({
      error:
        "An error occurred while processing your assessment. Please try again.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
