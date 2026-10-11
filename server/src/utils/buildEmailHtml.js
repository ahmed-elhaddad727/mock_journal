function scoreColor(score) {
  if (score >= 80) return { bg: "#059669", label: "Excellent", light: "#d1fae5", text: "#065f46" };
  if (score >= 60) return { bg: "#2563eb", label: "Good", light: "#dbeafe", text: "#1e40af" };
  if (score >= 40) return { bg: "#d97706", label: "Needs Improvement", light: "#fef3c7", text: "#92400e" };
  return { bg: "#dc2626", label: "Requires Attention", light: "#fee2e2", text: "#991b1b" };
}

function buildEmailHtml(studentName, school, result, questions, answers) {
  const esc = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const typeColors = {
    Grammar: "#1d4ed8",
    Spelling: "#dc2626",
    Punctuation: "#7c3aed",
    Vocabulary: "#059669",
    "Sentence Structure": "#d97706",
    "Word Choice": "#0891b2",
  };

  const overall = scoreColor(result.overallScore);

  // Build summary table of all question scores
  const summaryRows = result.questions
    .map((q) => {
      const qc = scoreColor(q.questionScore);
      return `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">
            Question ${q.questionNumber}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">
            <span style="display:inline-flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${qc.bg};"></span>
              <span style="font-size:13px;font-weight:600;color:${qc.text};">${qc.label}</span>
            </span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#64748b;">
            ${q.wordCount || countWords(answers[q.questionNumber - 1] || "")} words
          </td>
        </tr>`;
    })
    .join("");

  const questionBlocks = result.questions
    .map((q) => {
      const qc = scoreColor(q.questionScore);

      const mistakesHtml =
        q.mistakes && q.mistakes.length > 0
          ? q.mistakes
              .map(
                (m) => `
          <tr>
            <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
              <span style="color:#dc2626;text-decoration:line-through;font-size:13px;">${esc(m.originalText)}</span>
            </td>
            <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
              <span style="color:#059669;font-weight:600;font-size:13px;">${esc(m.correction)}</span>
            </td>
            <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
              <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;color:#fff;background:${typeColors[m.type] || "#3b82f6"};">${esc(m.type)}</span>
            </td>
            <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#475569;">${esc(m.explanation)}</td>
          </tr>`
              )
              .join("")
          : `<tr><td colspan="4" style="padding:16px;text-align:center;color:#059669;font-weight:600;">✓ No mistakes found — excellent work!</td></tr>`;

      // Strengths section
      const strengthsHtml = q.strengths
        ? `<div style="margin-top:8px;background:#f0fdf4;border-left:3px solid #22c55e;border-radius:0 6px 6px 0;padding:8px 12px;">
            <p style="margin:0;font-size:12px;font-weight:600;color:#166534;">✓ Strengths:</p>
            <p style="margin:4px 0 0;font-size:12px;color:#334155;line-height:1.5;">${esc(q.strengths)}</p>
          </div>`
        : "";

      return `
      <div style="margin-bottom:32px;">
        <!-- Question Header -->
        <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <p style="margin:0;font-size:13px;font-weight:700;color:#1e40af;">Question ${q.questionNumber}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#334155;">${esc(questions[q.questionNumber - 1])}</p>
            </div>
            <div style="text-align:right;">
              <span style="display:inline-block;padding:6px 14px;border-radius:9999px;background:${qc.bg};color:#ffffff;font-size:12px;font-weight:700;">
                ${qc.label}
              </span>
            </div>
          </div>
        </div>

        <!-- Student Answer -->
        <div style="background:#f8fafc;padding:12px 16px;border-radius:8px;margin-bottom:12px;">
          <p style="margin:0;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Your Answer</p>
          <p style="margin:6px 0 0;font-size:14px;color:#334155;line-height:1.6;">${esc(answers[q.questionNumber - 1] || "(no answer)")}</p>
          <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">Word count: ${q.wordCount || countWords(answers[q.questionNumber - 1] || "")}</p>
        </div>

        <!-- Mistakes Table -->
        ${q.mistakes && q.mistakes.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;">Original</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;">Correction</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;">Type</th>
              <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;">Explanation</th>
            </tr>
          </thead>
          <tbody>${mistakesHtml}</tbody>
        </table>
        ` : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;text-align:center;margin-bottom:12px;">
              <p style="margin:0;font-size:13px;color:#166534;font-weight:600;">✓ Perfect! No mistakes found in this answer.</p>
            </div>`}

        <!-- Feedback -->
        <div style="margin-top:10px;background:${qc.light};border-radius:8px;padding:12px 16px;">
          <p style="margin:0;font-size:12px;font-weight:700;color:${qc.text};text-transform:uppercase;letter-spacing:0.5px;">Feedback</p>
          <p style="margin:6px 0 0;font-size:13px;color:#334155;line-height:1.6;">${esc(q.questionFeedback || "No feedback provided.")}</p>
        </div>

        <!-- Strengths -->
        ${strengthsHtml}
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:700px;margin:0 auto;padding:24px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Writing Assessment Results</h1>
      <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Detailed feedback for ${esc(studentName)}</p>
      <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">${esc(school)}</p>
    </div>

    <!-- Overall Performance -->
    <div style="background:#ffffff;padding:32px;border-bottom:1px solid #e2e8f0;text-align:center;">
      <div style="display:inline-block;padding:12px 32px;border-radius:9999px;background:${overall.bg};color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;">
        ${overall.label}
      </div>
      <div style="margin-top:12px;">
        <span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${overall.bg};margin-right:6px;vertical-align:middle;"></span>
        <span style="font-size:13px;color:#64748b;vertical-align:middle;">Overall Performance</span>
      </div>
      <div style="margin-top:16px;background:${overall.light};border-radius:8px;padding:12px 16px;">
        <p style="margin:0;font-size:14px;color:#334155;line-height:1.6;">${esc(result.overallFeedback || "No overall feedback provided.")}</p>
      </div>
    </div>

    <!-- Score Summary Table -->
    <div style="background:#ffffff;padding:24px 32px;border-bottom:1px solid #e2e8f0;">
      <h2 style="margin:0 0 16px 0;font-size:16px;font-weight:700;color:#1e293b;">Performance Summary</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;">Question</th>
            <th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;">Performance</th>
            <th style="padding:12px 16px;text-align:left;font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;">Length</th>
          </tr>
        </thead>
        <tbody>
          ${summaryRows}
        </tbody>
      </table>
    </div>

    <!-- Detailed Question Feedback -->
    <div style="background:#ffffff;padding:32px;border-radius:0 0 16px 16px;">
      <h2 style="margin:0 0 24px 0;font-size:16px;font-weight:700;color:#1e293b;">Detailed Feedback</h2>
      ${questionBlocks}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">This is an automated report generated by the Writing Assessment System.</p>
      <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Please review the corrections carefully to improve your writing.</p>
    </div>
  </div>
</body>
</html>`;
}

// Helper function to count words
function countWords(s) {
  const t = s.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
}

export default buildEmailHtml;
