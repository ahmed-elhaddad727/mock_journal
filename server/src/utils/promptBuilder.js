function buildPrompt(questions, answers) {
  const sections = questions
    .map(
      (q, i) =>
        `Question ${i + 1}: ${q}\nStudent Answer: ${answers[i] || "(no answer)"}`
    )
    .join("\n\n");

  return `You are a professional English writing examiner. Analyze the student's answers below and identify ALL mistakes.

${sections}

For EACH question, you MUST provide your analysis in EXACTLY this JSON format (no markdown fences, no extra text, just raw JSON):

{
  "overallScore": <number 0-100>,
  "overallFeedback": "<2-3 sentence summary of overall performance>",
  "questions": [
    {
      "questionNumber": 1,
      "mistakes": [
        {
          "originalText": "<the exact incorrect text from the student's answer>",
          "correction": "<the corrected version>",
          "type": "<Grammar|Spelling|Punctuation|Vocabulary|Sentence Structure|Word Choice>",
          "explanation": "<brief explanation of the rule or reason>"
        }
      ],
      "questionScore": <number 0-100>,
      "questionFeedback": "<1-2 sentence feedback for this specific answer>",
      "wordCount": <number of words in the answer>,
      "strengths": "<what the student did well in this answer>"
    }
  ]
}

CRITICAL RULES:
- You MUST include ALL fields for EVERY question
- questionScore MUST be a number between 0-100 for each question
- questionFeedback MUST be specific to each question
- strengths MUST highlight what was done well
- If an answer has no mistakes, return an empty mistakes array but STILL include questionScore, questionFeedback, wordCount, and strengths
- Always return valid JSON
- Keep explanations concise and educational`;
}

export default buildPrompt;
