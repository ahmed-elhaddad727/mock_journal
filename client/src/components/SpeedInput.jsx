import { useState, useRef, useCallback, useEffect } from "react";

/* ───────── Tuning ───────── */
const PAUSE_MS = 3000; // a gap longer than this is a pause: its time is NOT counted
const MIN_ACTIVE_MS = 1500; // no WPM shown before this much active typing
const TICK_MS = 200;
const CHARS_PER_WORD = 5; // standard WPM convention

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

/* Use the browser's own event timestamp (set when the key was processed,
   not when React re-rendered) - it's far more precise on a busy page. */
const eventTime = (e) => {
  const t = e.nativeEvent?.timeStamp;
  return typeof t === "number" && t < 1e12 ? t : performance.now();
};

const countWords = (s) => {
  const t = s.trim();
  return t === "" ? 0 : t.split(/\s+/).length;
};

const SpeedInput = ({ question, index, onMetrics }) => {
  const [text, setText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isTyping, setIsTyping] = useState(false);

  const st = useRef(freshStats());
  const intervalRef = useRef(null);
  const idleTimerRef = useRef(null);

  /* ── Metrics ───────────────────────────────────────────────
     Speed    = chars / 5 / active minutes
     Each burst's first keystroke is excluded from the char count, because
     the time before it isn't counted (n keystrokes only span n-1 gaps).
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

  /* Stopped typing: freeze the numbers at the last keystroke and report */
  const finish = useCallback(() => {
    stopTicker();
    clearTimeout(idleTimerRef.current);
    setIsTyping(false);
    const s = st.current;
    if (s.inserted === 0 && s.alive === 0) return;
    s.lastT = null; // next keystroke starts a new burst
    const m = compute(performance.now(), false);
    setWpm(m.wpm);
    setAccuracy(m.accuracy);
    onMetrics?.({
      index,
      wpm: m.wpm,
      rawWpm: m.rawWpm,
      accuracy: m.accuracy,
      activeSeconds: Math.round(s.activeMs / 1000),
      typedChars: s.inserted,
      correctedChars: s.deleted,
    });
  }, [compute, stopTicker, onMetrics, index]);

  const handleChange = (e) => {
    const value = e.target.value;
    const native = e.nativeEvent || {};
    const inputType = native.inputType || "";
    const data = native.data;
    const t = eventTime(e);
    const s = st.current;

    const delta = value.length - s.prevLen;
    s.prevLen = value.length;

    setText(value);
    setWordCount(countWords(value));

    /* Box cleared → start over */
    if (value.length === 0) {
      st.current = freshStats();
      stopTicker();
      clearTimeout(idleTimerRef.current);
      setIsTyping(false);
      setWpm(0);
      setAccuracy(100);
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

  const handleBlur = () => finish();

  useEffect(
    () => () => {
      clearInterval(intervalRef.current);
      clearTimeout(idleTimerRef.current);
    },
    []
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
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Type your response here…"
          className="w-full px-5 pt-4 pb-12 rounded-xl resize-none outline-none text-slate-700 placeholder-slate-400 text-sm leading-relaxed bg-transparent"
        />

        {/* Submitted with the form alongside the answer */}
        <input type="hidden" name={`wpm-${index}`} value={wpm} />
        <input type="hidden" name={`accuracy-${index}`} value={accuracy} />

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
            <div className="flex items-center gap-2" title="Net words per minute">
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
};

export default SpeedInput;
