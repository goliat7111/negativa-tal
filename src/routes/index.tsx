import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Play, Pause, ChevronRight, Eye, EyeOff } from "lucide-react";
import "../negativa-tal.css";

const EPS = 1e-9;
const clean = (n: number) => (Math.abs(n) < EPS ? 0 : Number(n.toFixed(6)));
const fmt = (n: number) =>
  clean(n).toLocaleString("sv-SE", { maximumFractionDigits: 6 });

type Mode = "addition" | "subtraction" | "multiplication" | "division";

function OpIcon({ type }: { type: Mode }) {
  return (
    <svg viewBox="0 0 40 40" className="op-svg" aria-hidden="true">
      {type === "addition" && (
        <>
          <path d="M20 9V31" />
          <path d="M9 20H31" />
        </>
      )}
      {type === "subtraction" && <path d="M9 20H31" />}
      {type === "multiplication" && (
        <>
          <path d="M11 11L29 29" />
          <path d="M29 11L11 29" />
        </>
      )}
      {type === "division" && (
        <>
          <circle cx="20" cy="10" r="2.5" />
          <path d="M9 20H31" />
          <circle cx="20" cy="30" r="2.5" />
        </>
      )}
    </svg>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Modellera negativa tal" },
      {
        name: "description",
        content:
          "Interaktivt lärarverktyg: addition, subtraktion, multiplikation och division med negativa tal på en tallinje.",
      },
      { property: "og:title", content: "Modellera negativa tal" },
      {
        property: "og:description",
        content:
          "Interaktivt lärarverktyg: addition, subtraktion, multiplikation och division med negativa tal på en tallinje.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

function App() {
  const [start, setStart] = useState<number | null>(null);
  const [term, setTerm] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("addition");
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showTarget, setShowTarget] = useState(false);
  const [showSimpleExplanation, setShowSimpleExplanation] = useState(false);

  const hasValues =
    start !== null && term !== null && Number.isFinite(start) && Number.isFinite(term);
  const first = start ?? 0;
  const second = term ?? 0;
  const isMultiplication = mode === "multiplication";
  const isDivision = mode === "division";
  const divisionValid = !isDivision || Math.abs(second) > EPS;
  const result = !hasValues
    ? 0
    : mode === "addition"
      ? first + second
      : mode === "subtraction"
        ? first - second
        : isMultiplication
          ? first * second
          : divisionValid
            ? first / second
            : NaN;
  const addChange = mode === "addition" ? second : -second;
  const basicDirection = addChange >= 0 ? 1 : -1;
  const multiplicationStepSize = Math.abs(first);
  const multiplicationDirection =
    first === 0 ? 0 : Math.sign(first) * (second < 0 ? -1 : 1);
  const multiplicationStepValue = first * Math.sign(second);
  const divisionStepSize = Math.abs(second);
  const divisionDirection = first === 0 ? 0 : Math.sign(first);
  const modelAmount = isMultiplication
    ? Math.abs(second)
    : isDivision && divisionValid
      ? Math.abs(result)
      : Math.abs(addChange);
  const fullSteps = Math.floor(modelAmount + EPS);
  const remainder = clean(modelAmount - fullSteps);
  const totalStages = modelAmount < EPS ? 0 : fullSteps + (remainder > EPS ? 1 : 0);
  const finished = hasValues && divisionValid && currentStep >= totalStages;
  const progressAmount = !hasValues
    ? 0
    : Math.min(currentStep, fullSteps) + (currentStep > fullSteps ? remainder : 0);
  const current = !hasValues
    ? 0
    : isMultiplication
      ? multiplicationDirection * multiplicationStepSize * progressAmount
      : isDivision
        ? divisionDirection * divisionStepSize * progressAmount
        : first + basicDirection * progressAmount;
  const targetPosition = isDivision ? first : result;
  const min = Math.min(
    -10,
    (isMultiplication || isDivision ? 0 : first) - 2,
    targetPosition - 2,
    first - 2,
  );
  const max = Math.max(
    10,
    (isMultiplication || isDivision ? 0 : first) + 2,
    targetPosition + 2,
    first + 2,
  );
  const span = max - min || 1;
  const tickStep = span > 40 ? Math.ceil(span / 20) : span > 20 ? 2 : 1;
  const tickStart = Math.ceil(min / tickStep) * tickStep;
  const ticks = useMemo(() => {
    const a: number[] = [];
    for (let n = tickStart; n <= max + EPS; n += tickStep) a.push(clean(n));
    return a;
  }, [tickStart, max, tickStep]);
  const pct = (n: number) => ((n - min) / span) * 100;

  const termText = second < 0 ? `(${fmt(second)})` : fmt(second);
  const firstText =
    first < 0 && (isMultiplication || isDivision) ? `(${fmt(first)})` : fmt(first);
  const operator =
    mode === "addition" ? "+" : mode === "subtraction" ? "−" : isMultiplication ? "×" : "÷";

  useEffect(() => {
    if (!playing || finished || !hasValues || !divisionValid || !totalStages) {
      if (finished) setPlaying(false);
      return;
    }
    const t = setTimeout(() => setCurrentStep((s) => Math.min(s + 1, totalStages)), 1000);
    return () => clearTimeout(t);
  }, [playing, currentStep, totalStages, finished, hasValues, divisionValid]);

  const restart = () => {
    setPlaying(false);
    setCurrentStep(0);
  };
  const reset = () => {
    setStart(null);
    setTerm(null);
    setMode("addition");
    setCurrentStep(0);
    setPlaying(false);
    setShowTarget(false);
    setShowSimpleExplanation(false);
  };
  const readNumber = (v: string) => {
    if (v === "") return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const movement = !hasValues
    ? "Ange ett värde i båda rutorna för att börja modellera beräkningen."
    : mode === "addition"
      ? `Vi startar på ${fmt(first)} och flyttar ${fmt(Math.abs(second))} ${second >= 0 ? "åt höger" : "åt vänster"}.`
      : mode === "subtraction"
        ? `Vi startar på ${fmt(first)}. Att subtrahera ${fmt(second)} betyder en förflyttning ${second < 0 ? "åt höger" : "åt vänster"} med ${fmt(Math.abs(second))}.`
        : isMultiplication
          ? `Från 0 gör vi ${fmt(Math.abs(second))} hopp. Varje hopp är ${fmt(multiplicationStepValue)}.`
          : !divisionValid
            ? "Division med 0 är inte definierad."
            : `Vi visar ${firstText} ÷ ${termText} som grupper med storleken ${fmt(Math.abs(second))}. Antalet grupper är ${fmt(Math.abs(result))}.`;
  const simpleExplanation = !hasValues
    ? "Ange två tal för att se hur räknesättet fungerar."
    : mode === "addition"
      ? `Börja på ${fmt(first)} och flytta ${fmt(Math.abs(second))} steg ${second >= 0 ? "åt höger" : "åt vänster"}.`
      : mode === "subtraction"
        ? `Börja på ${fmt(first)} och flytta ${fmt(Math.abs(second))} steg ${second < 0 ? "åt höger" : "åt vänster"}.`
        : isMultiplication
          ? `Gör ${fmt(Math.abs(second))} hopp från 0. Varje hopp är ${fmt(multiplicationStepValue)}.`
          : !divisionValid
            ? "Det går inte att dela med 0."
            : `Vilket tal gånger ${fmt(second)} blir ${fmt(first)}? Svaret är ${fmt(result)}.`;

  const segments = Array.from({ length: Math.min(currentStep, totalStages) }, (_, i) => {
    const amount = i < fullSteps ? 1 : remainder;
    const before = i;
    if (isMultiplication)
      return {
        from: multiplicationDirection * multiplicationStepSize * before,
        to: multiplicationDirection * multiplicationStepSize * (before + amount),
      };
    if (isDivision)
      return {
        from: divisionDirection * divisionStepSize * before,
        to: divisionDirection * divisionStepSize * (before + amount),
      };
    return {
      from: first + basicDirection * before,
      to: first + basicDirection * (before + amount),
    };
  });

  const disabled = !hasValues || !divisionValid || finished || !totalStages;
  const stageLabel = isDivision ? "Grupp" : isMultiplication ? "Hopp" : "Steg";
  const operations: [Mode, string][] = [
    ["addition", "Addition"],
    ["subtraction", "Subtraktion"],
    ["multiplication", "Multiplikation"],
    ["division", "Division"],
  ];

  return (
    <main className="negativa-tal-root">
      <div className="shell">
        <header>
          <div>
            <small>INTERAKTIVT LÄRARVERKTYG</small>
            <h1>Laborera med negativa tal</h1>
            <p>Addition, subtraktion, multiplikation och division på en tallinje.</p>
          </div>
          <button className="light" onClick={reset}>
            <RotateCcw /> Rensa
          </button>
        </header>
        <div className="layout">
          <section className="controls card">
            <label>Räknesätt</label>
            <div className="operations">
              {operations.map(([key, label]) => (
                <button
                  key={key}
                  aria-label={label}
                  title={label}
                  className={`op ${mode === key ? `active ${key}` : ""}`}
                  onClick={() => {
                    setMode(key);
                    restart();
                  }}
                >
                  <OpIcon type={key} />
                </button>
              ))}
            </div>
            <div className="term-fields">
              <label>
                1:a termen
                <input
                  type="number"
                  step="any"
                  value={start ?? ""}
                  placeholder="Ange värde"
                  onChange={(e) => {
                    setStart(readNumber(e.target.value));
                    restart();
                  }}
                />
              </label>
              <label>
                2:a termen
                <input
                  type="number"
                  step="any"
                  value={term ?? ""}
                  placeholder="Ange värde"
                  onChange={(e) => {
                    setTerm(readNumber(e.target.value));
                    restart();
                  }}
                />
              </label>
            </div>
            <p className="hint">Heltal och decimaltal stöds.</p>
            <div className="explain">{movement}</div>
            <button
              className="light explain-toggle"
              aria-expanded={showSimpleExplanation}
              onClick={() => setShowSimpleExplanation((visible) => !visible)}
            >
              {showSimpleExplanation ? "Dölj enkel förklaring" : "Visa enkel förklaring"}
            </button>
            <div className="actions">
              <button disabled={!hasValues || !divisionValid} onClick={() => setShowTarget((v) => !v)}>
                {showTarget ? <EyeOff /> : <Eye />}
                {showTarget ? "Dölj målbild" : "Visa svag målbild"}
              </button>
              <button className="primary" disabled={disabled} onClick={() => setPlaying((v) => !v)}>
                {playing ? <Pause /> : <Play />}
                {playing ? "Pausa" : currentStep ? "Fortsätt" : "Spela automatiskt"}
              </button>
              <button
                className="amber"
                disabled={disabled}
                onClick={() => {
                  setPlaying(false);
                  setCurrentStep((s) => Math.min(s + 1, totalStages));
                }}
              >
                <ChevronRight />
                {isDivision ? "En grupp" : isMultiplication ? "Ett hopp" : "Ett steg"}
              </button>
              <button disabled={!hasValues} onClick={restart}>
                <RotateCcw />
                Till startpunkten
              </button>
            </div>
          </section>
          <section className="visual card">
            <div className="calc">
              <span>Beräkning</span>
              <h2>
                {hasValues ? (
                  <>
                    {firstText} {operator} {termText}{" "}
                    {!divisionValid
                      ? "= ej definierat"
                      : finished || (!totalStages && isDivision)
                        ? `= ${fmt(result)}`
                        : "= ?"}
                  </>
                ) : (
                  "Ange värden"
                )}
              </h2>
              {hasValues && divisionValid && (
                <b>
                  {stageLabel} {Math.min(currentStep, totalStages)} av {totalStages} · Nu på{" "}
                  {fmt(current)}
                </b>
              )}
            </div>
            <div className="numberline">
              <div className="axis" />
              {showTarget && hasValues && divisionValid && !finished && (
                <div className="target" style={{ left: `${pct(targetPosition)}%` }}>
                  Mål
                </div>
              )}
              {ticks.map((n) => (
                <div className="tick" key={n} style={{ left: `${pct(n)}%` }}>
                  <i />
                  <span>{fmt(n)}</span>
                </div>
              ))}
              {segments.map((s, i) => (
                <div
                  className={`segment ${isDivision ? "blue" : isMultiplication ? "violet" : ""}`}
                  key={i}
                  style={{
                    left: `${Math.min(pct(s.from), pct(s.to))}%`,
                    width: `${Math.abs(pct(s.to) - pct(s.from))}%`,
                  }}
                />
              ))}
              {hasValues && divisionValid && (
                <div className={`marker ${finished ? "done" : ""}`} style={{ left: `${pct(current)}%` }}>
                  <strong>{fmt(current)}</strong>
                  <i />
                </div>
              )}
              <div className="message">
                {!hasValues
                  ? "Ange båda värdena för att starta."
                  : !divisionValid
                    ? "Division med 0 är inte definierad."
                    : finished
                      ? `Klart! Resultatet är ${fmt(result)}.`
                      : currentStep
                        ? `${stageLabel} ${currentStep}. Nu är vi på ${fmt(current)}.`
                        : isDivision
                          ? `Hur många grupper om ${fmt(Math.abs(second))} ryms i ${fmt(Math.abs(first))}?`
                          : isMultiplication
                            ? `Vi börjar på 0. Varje hopp är ${fmt(multiplicationStepValue)}.`
                            : `Vi börjar på ${fmt(first)}.`}
              </div>
            </div>
            {showSimpleExplanation && (
              <div className="simple-explain">{simpleExplanation}</div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
