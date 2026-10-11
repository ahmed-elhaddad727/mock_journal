export default function buildPrompt(questions, answers) {
  const sections = questions
    .map(
      (q, i) =>
        `Question ${i + 1}: ${q}\nStudent Answer: ${answers[i] || "(no answer)"}`,
    )
    .join("\n\n");

  return `You are a professional English writing examiner. Analyze the student's answers below and identify ALL mistakes.

${sections}

For EACH question, provide your analysis in EXACTLY this JSON format (no markdown fences, no extra text, just raw JSON) in the file uploaded you have the way to score the answer in [blue, green, yellow ,red]:

{
  "overallScore": <number 0-100>,
  "overallFeedback": "<2-3 sentence summary>",
  "questions": [
    {
      "questionNumber": 1,
      "mistakes": [
        {
          "originalText": "<the exact incorrect text>",
          "correction": "<the corrected version>",
          "type": "<Grammar|Spelling|Punctuation|Vocabulary|Sentence Structure|Word Choice>",
          "explanation": "<brief explanation of the rule or reason>"
        }
      ],
      "questionScore": <string [blue,green,yellow,red]>,
      "questionFeedback": "<1-2 sentence feedback for this answer>"
    }
  ]
}

Rules:
- follow the instructiosn in the file
- Be thorough but fair
- If an answer has no mistakes, return an empty mistakes array
- Always return valid JSON
- Keep explanations concise and educational`;
}
