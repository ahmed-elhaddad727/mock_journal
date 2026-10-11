import { useState, useRef, useCallback, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
/* ── Configuration ─────────────────────────────────────────────────────── */
const API_URL = "https://mock-journal-server.vercel.app/api/submit-assessment";

const questions = [
  "After entering STEM schools, the study system changed, and the project took up a significant amount of your usual study time. Explain how you organize your time between studying different subjects and working on the project.",
  "During the research step of the Engineering Design Process, explain how will studying existing methods, technologies, or real-world examples help you generate ideas, and improve your energy system design. ",
  "In CH 1.01, you learned how to create a chart that illustrates the main processes of scientific thinking. Briefly explain the benefits of this chart and how the two steps outlined in the chart will assist you in achieving your challenge of constructing your structures.",
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

/* ── Typing-measurement tuning ─────────────────────────────────────────── */
const PAUSE_MS = 3000; // a gap longer than this is a pause: its time is NOT counted
const MIN_ACTIVE_MS = 1500; // no WPM shown before this much active typing
const TICK_MS = 200;
const CHARS_PER_WORD = 5; // standard WPM convention

const EMPTY_METRICS = {
  wpm: 0,
  rawWpm: 0,
  accuracy: 100,
  activeSeconds: 0,
  typedChars: 0,
  correctedChars: 0,
};

const freshStats = () => ({
  prevLen: 0,
  lastT: null, // timestamp of the previous input event (null = a new burst starts)
  activeMs: 0, // sum of gaps between consecutive keystrokes (pauses excluded)
  rawChars: 0, // characters typed, ignoring deletions (gross)
  netChars: 0, // characters typed minus deletions (net)
  inserted: 0, // every character the user typed
  deleted: 0, // every typed character the user deleted
  alive: 0, // typed characters currently in the box
});

/* Browser event timestamp: set when the key was processed, not when React
   re-rendered, so it's far more precise on a busy page. */
const eventTime = (e) => {
  const t = e.nativeEvent?.timeStamp;
  return typeof t === "number" && t < 1e12 ? t : performance.now();
};

const countWords = (s) => {
  const t = s.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
};

/* ── Answer Input (with words, speed and accuracy) ────────────────────── */
function AnswerInput({ question, index, value, onChange, onMetrics }) {
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isTyping, setIsTyping] = useState(false);

  const st = useRef(freshStats());
  const intervalRef = useRef(null);
  const idleTimerRef = useRef(null);

  /* Always-fresh copies for timers (avoids stale closures) */
  const valueRef = useRef(value);
  valueRef.current = value;
  const onMetricsRef = useRef(onMetrics);
  onMetricsRef.current = onMetrics;

  const wordCount = countWords(value);

  /* Speed    = chars / 5 / active minutes
     Each burst's first keystroke is excluded from the char count, because the
     time before it isn't counted (n keystrokes only span n-1 gaps).
     Accuracy = typed chars that survived / all typed chars (correction rate). */
  const compute = useCallback((now, includeTail) => {
    const s = st.current;
    let ms = s.activeMs;
    if (includeTail && s.lastT != null) {
      const gap = now - s.lastT;
      if (gap >= 0 && gap <= PAUSE_MS) ms += gap;
    }
    const acc =
      s.inserted === 0 ? 100 : Math.round((s.alive / s.inserted) * 100);
    if (ms < MIN_ACTIVE_MS) return { wpm: 0, rawWpm: 0, accuracy: acc };
    const minutes = ms / 60000;
    return {
      wpm: Math.round(s.netChars / CHARS_PER_WORD / minutes),
      rawWpm: Math.round(s.rawChars / CHARS_PER_WORD / minutes),
      accuracy: acc,
    };
  }, []);

  const stopTicker = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const startTicker = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setWpm(compute(performance.now(), true).wpm);
    }, TICK_MS);
  }, [compute]);

  const resetSession = useCallback(() => {
    st.current = freshStats();
    stopTicker();
    clearTimeout(idleTimerRef.current);
    setIsTyping(false);
    setWpm(0);
    setAccuracy(100);
  }, [stopTicker]);

  /* Stopped typing: freeze the numbers at the last keystroke and report them */
  const finish = useCallback(() => {
    stopTicker();
    clearTimeout(idleTimerRef.current);
    setIsTyping(false);
    if (valueRef.current === "") return;
    const s = st.current;
    s.lastT = null; // next keystroke starts a new burst
    const m = compute(performance.now(), false);
    setWpm(m.wpm);
    setAccuracy(m.accuracy);
    onMetricsRef.current?.({
      index,
      wpm: m.wpm,
      rawWpm: m.rawWpm,
      accuracy: m.accuracy,
      activeSeconds: Math.round(s.activeMs / 1000),
      typedChars: s.inserted,
      correctedChars: s.deleted,
    });
  }, [compute, stopTicker, index]);

  const handleChange = (e) => {
    const next = e.target.value;
    const native = e.nativeEvent || {};
    const inputType = native.inputType || "";
    const data = native.data;
    const t = eventTime(e);
    const s = st.current;

    onChange(next);

    const delta = next.length - s.prevLen;
    s.prevLen = next.length;

    /* Box cleared → start over */
    if (next.length === 0) {
      resetSession();
      onMetricsRef.current?.({ index, ...EMPTY_METRICS });
      return;
    }

    const isPaste =
      inputType === "insertFromPaste" ||
      inputType === "insertFromDrop" ||
      inputType === "insertFromYank";

    if (isPaste) {
      /* Pasted text is never counted, and the clock restarts afterwards */
      s.lastT = null;
    } else {
      const gap = s.lastT == null ? null : t - s.lastT;
      const continuing = gap !== null && gap >= 0 && gap <= PAUSE_MS;
      s.lastT = t;
      if (continuing) s.activeMs += gap;

      /* How many characters were really typed / removed by this event.
         (Handles typing over a selection, where the length doesn't change.) */
      let ins = 0;
      let rem = 0;
      if (
        inputType.startsWith("insert") &&
        inputType !== "insertCompositionText" &&
        typeof data === "string" &&
        data.length > 0
      ) {
        ins = data.length;
        rem = Math.max(0, ins - delta);
      } else if (delta > 0) {
        ins = delta;
      } else {
        rem = -delta;
      }

      const removed = Math.min(rem, s.alive); // only typed chars count as corrections
      s.inserted += ins;
      s.deleted += removed;
      s.alive += ins - removed;

      if (continuing) {
        s.rawChars += ins;
        s.netChars += ins;
      }
      s.netChars = Math.max(0, s.netChars - removed);
    }

    const m = compute(t, false);
    setWpm(m.wpm);
    setAccuracy(m.accuracy);

    setIsTyping(true);
    startTicker();
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(finish, PAUSE_MS);
  };

  /* Focus lost → stop counting and report */
  const handleBlur = () => finish();

  /* Parent cleared the value (e.g. after a successful submit) → reset */
  useEffect(() => {
    if (
      value === "" &&
      (st.current.prevLen !== 0 || st.current.inserted !== 0)
    ) {
      resetSession();
    }
  }, [value, resetSession]);

  /* Cleanup on unmount */
  useEffect(
    () => () => {
      clearInterval(intervalRef.current);
      clearTimeout(idleTimerRef.current);
    },
    [],
  );

  const accColor =
    accuracy >= 95
      ? "text-emerald-600"
      : accuracy >= 85
        ? "text-amber-600"
        : "text-rose-600";

  return (
    <div className="group">
      {/* ── Question label ── */}
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

      {/* ── Input wrapper ── */}
      <div
        className={`relative rounded-xl border-2 bg-white transition-all duration-300 ${
          isTyping
            ? "border-blue-500 shadow-lg shadow-blue-100 ring-4 ring-blue-50"
            : "border-slate-200 shadow-sm hover:border-blue-300"
        }`}
      >
        <textarea
          id={`answer-${index}`}
          name={`answer-${index}`}
          rows={4}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Type your response here…"
          className="w-full px-5 pt-4 pb-12 rounded-xl resize-none outline-none text-slate-700 placeholder-slate-400 text-sm leading-relaxed bg-transparent"
        />

        {/* ── Live metrics bar ── */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-2.5 bg-linear-to-r from-blue-50/80 to-white border-t border-blue-100 rounded-b-xl">
          {/* Words */}
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-xs font-medium text-blue-700">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
          </div>

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-1.5">
              <span className="flex gap-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
              <span className="text-xs text-blue-500 font-medium">Typing…</span>
            </div>
          )}

          {/* Accuracy + WPM */}
          <div className="flex items-center gap-4">
            <span
              className={`text-xs font-semibold tabular-nums ${accColor}`}
              title="Share of typed characters that did not need correcting"
            >
              {accuracy}% accuracy
            </span>
            <div
              className="flex items-center gap-2"
              title="Net words per minute"
            >
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-xs font-semibold text-blue-700 tabular-nums">
                {wpm} WPM
              </span>
            </div>
          </div>
        </div>
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

  /* Typing metrics per answer (a ref: updated synchronously, read on submit) */
  const metricsRef = useRef([]);

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

  const handleMetrics = (m) => {
    metricsRef.current[m.index - 1] = m;
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

    /* One entry per question: words, speed, accuracy, active time … */
    const typingStats = questions.map((_, i) => {
      const { index, ...m } = metricsRef.current[i] ?? EMPTY_METRICS;
      return { question: i + 1, wordCount: countWords(answers[i]), ...m };
    });

    const payload = {
      studentName: fullName.trim(),
      email: email.trim(),
      school,
      questions,
      answers,
      typingStats,
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
        metricsRef.current = [];
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
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
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
                  onMetrics={handleMetrics}
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
