import { useState, useRef, useCallback, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";

/* ── Configuration ─────────────────────────────────────────────────────── */
const API_URL = "http://localhost:3001/api/submit-assessment";

const questions = [
  "Please describe your professional background and key areas of expertise.",
  "What motivated you to pursue a career in your current field of work?",
  "Outline a significant challenge you have overcome and the lessons learned.",
];

const stemSchools = [
  "STEM School Alexandria",
  "STEM School Cairo",
  "STEM School Giza",
  "STEM School Dakahlia",
  "STEM School Port Said",
  "STEM School Ismailia",
  "STEM School Assiut",
  "STEM School Minya",
  "STEM School Sohag",
  "STEM School Qena",
  "STEM School Aswan",
  "STEM School Red Sea",
  "STEM School Suez",
  "STEM School Beni Suef",
  "STEM School Fayoum",
  "STEM School Kafr El-Sheikh",
  "STEM School Beheira",
  "STEM School Gharbia",
  "STEM School Sharqia",
  "STEM School Monufia",
  "STEM School Qalyubia",
  "STEM School Damietta",
  "Other",
];

/* ── Answer Input (plain — no speed/accuracy/word metrics) ────────────── */
function AnswerInput({ question, index, value, onChange }) {
  return (
    <div className="group">
      <div className="flex items-start gap-3 mb-3">
        <span className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-blue-200">
          {index}
        </span>
        <label
          htmlFor={`answer-${index}`}
          className="text-slate-800 font-semibold text-base leading-relaxed pt-1"
        >
          {question}
        </label>
      </div>

      <div className="relative rounded-xl border-2 border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-300 focus-within:border-blue-500 focus-within:shadow-lg focus-within:shadow-blue-100 focus-within:ring-4 focus-within:ring-blue-50">
        <textarea
          id={`answer-${index}`}
          name={`answer-${index}`}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your response here…"
          className="w-full px-5 py-4 rounded-xl resize-none outline-none text-slate-700 placeholder-slate-400 text-sm leading-relaxed bg-transparent"
        />
      </div>
    </div>
  );
}

/* ── Main Form ─────────────────────────────────────────────────────────── */
export default function WritingAssessmentForm() {
  /* Student info */
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");

  /* Answers */
  const [answers, setAnswers] = useState(["", "", ""]);

  /* Submission state */
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // "success" | "error" | null
  const [submitMessage, setSubmitMessage] = useState("");

  const handleAnswerChange = (idx, value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage("");

    /* Client-side validation */
    if (!fullName.trim() || !email.trim() || !school) {
      setSubmitStatus("error");
      setSubmitMessage("Please fill in your full name, email, and school.");
      setSubmitting(false);
      return;
    }
    if (answers.some((a) => a.trim() === "")) {
      setSubmitStatus("error");
      setSubmitMessage("Please answer all three questions before submitting.");
      setSubmitting(false);
      return;
    }

    const payload = {
      studentName: fullName.trim(),
      email: email.trim(),
      school,
      questions,
      answers,
    };

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmitStatus("success");
        setSubmitMessage(
          `Assessment submitted successfully. Your results have been sent to ${email.trim()}.`,
        );
        /* Reset form */
        setFullName("");
        setEmail("");
        setSchool("");
        setAnswers(["", "", ""]);
      } else {
        setSubmitStatus("error");
        setSubmitMessage(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setSubmitStatus("error");
      setSubmitMessage(
        "Could not reach the server. Please check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* ── Header ── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 mb-4">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Writing Assessment
            </h1>
            <p className="mt-2 text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
              Please respond to the following questions. Your answers will be
              reviewed and detailed feedback will be sent to your email address.
            </p>
          </div>

          {/* ── Form Card ── */}
          <form
            onSubmit={handleSubmit}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-100 border border-blue-100 p-8 space-y-8"
          >
            {/* ── Student Information ── */}
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-blue-100 pb-2">
                Student Information
              </h2>

              {/* Full Name & Email — side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>
              </div>

              {/* STEM School — full width */}
              <div>
                <label
                  htmlFor="school"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  STEM School
                </label>
                <select
                  id="school"
                  name="school"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-700 outline-none transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="" disabled>
                    Select your STEM school
                  </option>
                  {stemSchools.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Questions ── */}
            <div className="space-y-8">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-blue-100 pb-2">
                Assessment Questions
              </h2>

              {questions.map((q, i) => (
                <AnswerInput
                  key={i}
                  question={q}
                  index={i + 1}
                  value={answers[i]}
                  onChange={(val) => handleAnswerChange(i, val)}
                />
              ))}
            </div>

            {/* ── Status Message ── */}
            {submitStatus && (
              <div
                className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  submitStatus === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {submitMessage}
              </div>
            )}

            {/* ── Submit ── */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide shadow-md transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 ${
                  submitting
                    ? "bg-blue-400 cursor-not-allowed text-white shadow-blue-100"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-200 hover:shadow-lg hover:shadow-blue-300"
                }`}
              >
                {submitting ? "Submitting…" : "Submit Assessment"}
              </button>
              <p className="mt-3 text-center text-xs text-slate-400">
                Your responses will be analyzed and detailed feedback will be
                sent to your email address.
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
