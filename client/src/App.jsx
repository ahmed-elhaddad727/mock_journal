import { useState, useRef, useCallback, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";

/* ── Configuration ─────────────────────────────────────────────────────── */
const WHATSAPP_NUMBER = "01042536794";
const GITHUB_REPO_URL = "https://github.com/ahmed-elhaddad727/mock_journal";
const API_URL="https://mock-journal-server.vercel.app/api/submit-assessment";
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
  "STEM School Luxor",
  "Other",
];

/* ── Typing-measurement tuning ─────────────────────────────────────────── */
const PAUSE_MS = 3000;
const MIN_ACTIVE_MS = 1500;
const TICK_MS = 200;
const CHARS_PER_WORD = 5;

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
  lastT: null,
  activeMs: 0,
  rawChars: 0,
  netChars: 0,
  inserted: 0,
  deleted: 0,
  alive: 0,
});

const eventTime = (e) => {
  const t = e.nativeEvent?.timeStamp;
  return typeof t === "number" && t < 1e12 ? t : performance.now();
};

const countWords = (s) => {
  const t = s.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
};

/* ── GitHub Star Demo (animated SVG) ──────────────────────────────────── */
function GitHubStarDemo() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const seq = [0, 1, 2, 3, 4, 5];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i >= seq.length) i = 0;
      setStep(seq[i]);
    }, 1200);
    return () => clearInterval(interval);
  }, [playing]);

  const cursorPos = [
    { x: 280, y: 80 },
    { x: 280, y: 80 },
    { x: 280, y: 80 },
    { x: 280, y: 80 },
    { x: 200, y: 120 },
    { x: 200, y: 120 },
  ];

  return (
    <div className="relative">
      <svg
        viewBox="0 0 400 220"
        className="w-full rounded-xl border border-slate-200 bg-white"
        style={{ maxHeight: "220px" }}
      >
        <rect x="0" y="0" width="400" height="28" rx="8" fill="#f1f5f9" />
        <circle cx="16" cy="14" r="5" fill="#fca5a5" />
        <circle cx="32" cy="14" r="5" fill="#fcd34d" />
        <circle cx="48" cy="14" r="5" fill="#86efac" />
        <rect x="70" y="6" width="260" height="16" rx="8" fill="#e2e8f0" />
        <text x="80" y="17" fontSize="9" fill="#64748b" fontFamily="monospace">
          github.com/ahmed-elhaddad727/mock_journal
        </text>
        <rect x="0" y="28" width="400" height="36" fill="#24292f" />
        <text x="16" y="50" fontSize="12" fill="#ffffff" fontWeight="bold">
          ⭐ mock_journal
        </text>
        <rect x="0" y="64" width="400" height="156" fill="#ffffff" />
        <text x="16" y="88" fontSize="11" fill="#0969da" fontWeight="600">
          ahmed-elhaddad727 / mock_journal
        </text>

        <g transform="translate(280, 70)">
          <rect
            x="0" y="0" width="100" height="28" rx="6"
            fill={step >= 2 ? "#1a7f37" : "#f6f8fa"}
            stroke={step >= 2 ? "#1a7f37" : "#d0d7de"}
            strokeWidth="1"
          />
          <polygon
            points="14,4 17,10 24,10.5 19,15 20.5,22 14,18 7.5,22 9,15 4,10.5 11,10"
            fill={step >= 2 ? "#ffffff" : "#57606a"}
            transform="translate(4, 3) scale(0.8)"
          />
          <text x="28" y="18" fontSize="11" fill={step >= 2 ? "#ffffff" : "#24292f"} fontWeight="600">
            {step >= 2 ? "Starred" : "Star"}
          </text>
          {step >= 2 && (
            <text x="72" y="18" fontSize="10" fill="#ffffff">1</text>
          )}
        </g>

        {step === 1 && (
          <circle cx="330" cy="84" r="4" fill="none" stroke="#3b82f6" strokeWidth="2">
            <animate attributeName="r" from="4" to="20" dur="0.5s" fill="freeze" />
            <animate attributeName="opacity" from="1" to="0" dur="0.5s" fill="freeze" />
          </circle>
        )}

        {step >= 3 && (
          <g transform="translate(330, 84)">
            <circle r="12" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.5">
              <animate attributeName="r" from="4" to="16" dur="0.6s" fill="freeze" />
              <animate attributeName="opacity" from="0.8" to="0" dur="0.6s" fill="freeze" />
            </circle>
            <text x="-6" y="4" fontSize="12" fill="#22c55e">✓</text>
          </g>
        )}

        <text x="16" y="110" fontSize="10" fill="#57606a">Public</text>
        <rect x="16" y="118" width="368" height="1" fill="#e2e8f0" />
        <rect x="16" y="128" width="368" height="16" rx="4" fill="#f6f8fa" />
        <text x="24" y="140" fontSize="9" fill="#0969da">📄 README.md</text>
        <rect x="16" y="148" width="368" height="16" rx="4" fill="#f6f8fa" />
        <text x="24" y="160" fontSize="9" fill="#0969da">📄 package.json</text>
        <rect x="16" y="168" width="368" height="16" rx="4" fill="#f6f8fa" />
        <text x="24" y="180" fontSize="9" fill="#0969da">📁 src/</text>
        <text x="16" y="200" fontSize="9" fill="#57606a">
          ⭐ Click the Star button to support this project!
        </text>

        <g
          transform={`translate(${cursorPos[step].x}, ${cursorPos[step].y})`}
          style={{ transition: "transform 0.6s ease" }}
        >
          <polygon
            points="0,0 0,16 4,12 7,18 10,16 7,10 12,10"
            fill="#1e293b"
            stroke="#ffffff"
            strokeWidth="1"
          />
          {step === 1 && (
            <circle cx="4" cy="4" r="8" fill="none" stroke="#3b82f6" strokeWidth="2">
              <animate attributeName="r" from="2" to="12" dur="0.4s" fill="freeze" />
              <animate attributeName="opacity" from="1" to="0" dur="0.4s" fill="freeze" />
            </circle>
          )}
        </g>

        <text x="380" y="212" fontSize="8" fill="#94a3b8" textAnchor="end">
          {step === 0 && "Hover over Star…"}
          {step === 1 && "Click!"}
          {step === 2 && "⭐ Starred!"}
          {step === 3 && "✓ Thank you!"}
          {step === 4 && "Explore the repo"}
          {step === 5 && "⭐ Done!"}
        </text>
      </svg>

      <button
        onClick={() => setPlaying(!playing)}
        className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm"
      >
        {playing ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="6,4 20,12 6,20" />
          </svg>
        )}
      </button>
    </div>
  );
}

/* ── Success Popup ────────────────────────────────────────────────────── */
function SuccessPopup({ onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(WHATSAPP_NUMBER).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-t-2xl px-6 py-5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-3">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Assessment Submitted!</h2>
          <p className="text-blue-100 text-sm mt-1">
            Your results have been sent to your email.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 text-sm">
                  Send Us Your Feedback
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  We would love to hear about your experience. Send your
                  feedback via WhatsApp to:
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-mono font-semibold text-blue-700 tracking-wider">
                    {WHATSAPP_NUMBER}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 p-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                    title="Copy number"
                  >
                    {copied ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 text-sm mb-1">
              ⭐ Support This Project
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              If you found this assessment helpful, please star our repository
              on GitHub:
            </p>
            <GitHubStarDemo />
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Visit Repository — ahmed-elhaddad727/mock_journal
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-md shadow-blue-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Answer Input (with words, speed and accuracy) ────────────────────── */
function AnswerInput({ question, index, value, onChange, onMetrics }) {
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isTyping, setIsTyping] = useState(false);

  const st = useRef(freshStats());
  const intervalRef = useRef(null);
  const idleTimerRef = useRef(null);

  const valueRef = useRef(value);
  valueRef.current = value;
  const onMetricsRef = useRef(onMetrics);
  onMetricsRef.current = onMetrics;

  const wordCount = countWords(value);

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

  const finish = useCallback(() => {
    stopTicker();
    clearTimeout(idleTimerRef.current);
    setIsTyping(false);
    if (valueRef.current === "") return;
    const s = st.current;
    s.lastT = null;
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
      s.lastT = null;
    } else {
      const gap = s.lastT == null ? null : t - s.lastT;
      const continuing = gap !== null && gap >= 0 && gap <= PAUSE_MS;
      s.lastT = t;
      if (continuing) s.activeMs += gap;

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

      const removed = Math.min(rem, s.alive);
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

  const handleBlur = () => finish();

  useEffect(() => {
    if (
      value === "" &&
      (st.current.prevLen !== 0 || st.current.inserted !== 0)
    ) {
      resetSession();
    }
  }, [value, resetSession]);

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

        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-2.5 bg-linear-to-r from-blue-50/80 to-white border-t border-blue-100 rounded-b-xl">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-medium text-blue-700">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
          </div>

          {isTyping && (
            <div className="flex items-center gap-1.5">
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              <span className="text-xs text-blue-500 font-medium">Typing…</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className={`text-xs font-semibold tabular-nums ${accColor}`}>
              {accuracy}% accuracy
            </span>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [answers, setAnswers] = useState(["", "", ""]);
  const metricsRef = useRef([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);

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
        setSubmitMessage("Assessment submitted successfully!");
        setFullName("");
        setEmail("");
        setSchool("");
        setAnswers(["", "", ""]);
        metricsRef.current = [];
        setShowPopup(true);
      } else {
        setSubmitStatus("error");
        setSubmitMessage(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setSubmitStatus("error");
      setSubmitMessage("Could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 mb-4">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Writing Assessment</h1>
            <p className="mt-2 text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
              Please respond to the following questions. Your answers will be reviewed
              and detailed feedback will be sent to your email address.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-blue-100 border border-blue-100 p-8 space-y-8">
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-blue-100 pb-2">Student Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 outline-none transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
                </div>
              </div>
              <div>
                <label htmlFor="school" className="block text-sm font-medium text-slate-700 mb-1.5">STEM School</label>
                <select id="school" value={school} onChange={(e) => setSchool(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-700 outline-none transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-50">
                  <option value="" disabled>Select your STEM school</option>
                  {stemSchools.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-lg font-semibold text-slate-800 border-b border-blue-100 pb-2">Assessment Questions</h2>
              {questions.map((q, i) => (
                <AnswerInput key={i} question={q} index={i + 1} value={answers[i]} onChange={(val) => handleAnswerChange(i, val)} onMetrics={handleMetrics} />
              ))}
            </div>

            {submitStatus && (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium ${submitStatus === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                {submitMessage}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <button type="submit" disabled={submitting}
                className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm tracking-wide shadow-md transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 ${submitting ? "bg-blue-400 cursor-not-allowed text-white shadow-blue-100" : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-200 hover:shadow-lg hover:shadow-blue-300"}`}>
                {submitting ? "Submitting…" : "Submit Assessment"}
              </button>
              <p className="mt-3 text-center text-xs text-slate-400">
                Your responses will be analyzed and detailed feedback will be sent to your email address.
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />

      {showPopup && <SuccessPopup onClose={() => setShowPopup(false)} />}
    </>
  );
}
