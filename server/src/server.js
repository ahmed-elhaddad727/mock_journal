// server.js — updated sections

/* ── API Route ────────────────────────────────────────────────────────── */
app.post("/api/submit-assessment", async (req, res) => {
  const { studentName, email, school, questions, answers } = req.body;

  /* ── Validation ── */
  if (!studentName || !email || !school || !questions || !answers) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  if (questions.length !== answers.length) {
    return res.status(400).json({ error: "Questions and answers length mismatch." });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  try {
    /* ── Step 1: Send to Gemini for correction ── */
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = buildPrompt(questions, answers);
    const geminiResult = await model.generateContent(prompt);
    const rawText = geminiResult.response.text();

    let analysis;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json\n?|\n?```/g, "").trim();
      analysis = JSON.parse(cleaned);
    }

    /* ── Step 2: Build and send email ── */
    const emailHtml = buildEmailHtml(studentName, school, analysis, questions, answers);

await transporter.sendMail({
  from: `"Writing Assessment System" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: `Your Writing Assessment Results — ${analysis.overallScore >= 80 ? "Excellent" : analysis.overallScore >= 60 ? "Good" : analysis.overallScore >= 40 ? "Needs Improvement" : "Requires Attention"}`,
  html: emailHtml,
});
await transporter.sendMail({
  from: `"Writing Assessment System" <${process.env.EMAIL_USER}>`,
  to: 'ahmed.elhaddad.dev@gmail.com',
  subject: `Your Writing Assessment Results — ${analysis.overallScore >= 80 ? "Excellent" : analysis.overallScore >= 60 ? "Good" : analysis.overallScore >= 40 ? "Needs Improvement" : "Requires Attention"}`,
  html: emailHtml,
});
    /* ── Step 3: Respond to client ── */
    return res.status(200).json({
      success: true,
      message: "Assessment submitted. Results have been sent to your email.",
      overallScore: analysis.overallScore,
    });
  } catch (err) {
    console.error("Assessment error:", err);
    return res.status(500).json({
      error: "An error occurred while processing your assessment. Please try again.",
    });
  }
});
