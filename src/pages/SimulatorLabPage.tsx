import { useState } from "react";
import atcData from "../data/atc_scenarios.json";
import { Panel } from "../components/ui";
import { toPhonetic } from "../lib/phonetic";
import { decodeMetar, SAMPLE_METARS } from "../lib/metar";
import type { AtcScenarioData } from "../types";

const scenarios = atcData as AtcScenarioData;

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

function AtcSandbox() {
  const [aircraftId, setAircraftId] = useState(scenarios.aircraft[0].id);
  const [airportId, setAirportId] = useState(scenarios.airports[0].id);
  const [positionId, setPositionId] = useState(scenarios.positions[0].id);
  const [intentionId, setIntentionId] = useState(scenarios.intentions[0].id);
  const [runway, setRunway] = useState(scenarios.airports[0].runways[0]);
  const [atis, setAtis] = useState(scenarios.atisLetters[0]);

  const aircraft = scenarios.aircraft.find((a) => a.id === aircraftId)!;
  const airport = scenarios.airports.find((a) => a.id === airportId)!;
  const position = scenarios.positions.find((p) => p.id === positionId)!;
  const intention = scenarios.intentions.find((i) => i.id === intentionId)!;

  const vars = {
    facility: airport.facilityName,
    callsign: aircraft.spokenCallsign,
    shortCallsign: aircraft.shortCallsign,
    position: fillTemplate(position.phrase, { runway }),
    atis,
    runway,
    airport: airport.icao,
  };

  const pilotCall = fillTemplate(intention.pilotTemplate, vars);
  const atcResponse = fillTemplate(intention.atcTemplate, vars);
  const readback = intention.readbackTemplate ? fillTemplate(intention.readbackTemplate, vars) : "";

  const filteredPositions = scenarios.positions.filter(
    (p) => p.context === intention.positionContext,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-ink-muted">Aircraft</span>
          <select
            value={aircraftId}
            onChange={(e) => setAircraftId(e.target.value)}
            className="mt-1 w-full rounded border border-panel-border bg-panel px-2 py-1.5 text-ink"
          >
            {scenarios.aircraft.map((a) => (
              <option key={a.id} value={a.id}>{a.type} ({a.tailNumber})</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-ink-muted">Airport</span>
          <select
            value={airportId}
            onChange={(e) => {
              const ap = scenarios.airports.find((a) => a.id === e.target.value)!;
              setAirportId(ap.id);
              setRunway(ap.runways[0]);
            }}
            className="mt-1 w-full rounded border border-panel-border bg-panel px-2 py-1.5 text-ink"
          >
            {scenarios.airports.map((a) => (
              <option key={a.id} value={a.id}>{a.icao} — {a.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-ink-muted">Position</span>
          <select
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
            className="mt-1 w-full rounded border border-panel-border bg-panel px-2 py-1.5 text-ink"
          >
            {filteredPositions.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-ink-muted">Intention</span>
          <select
            value={intentionId}
            onChange={(e) => setIntentionId(e.target.value)}
            className="mt-1 w-full rounded border border-panel-border bg-panel px-2 py-1.5 text-ink"
          >
            {scenarios.intentions.map((i) => (
              <option key={i.id} value={i.id}>{i.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-ink-muted">Runway</span>
          <select value={runway} onChange={(e) => setRunway(e.target.value)} className="mt-1 w-full rounded border border-panel-border bg-panel px-2 py-1.5 text-ink">
            {airport.runways.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        {airport.towered && (
          <label className="text-sm">
            <span className="text-ink-muted">ATIS</span>
            <select value={atis} onChange={(e) => setAtis(e.target.value)} className="mt-1 w-full rounded border border-panel-border bg-panel px-2 py-1.5 text-ink">
              {scenarios.atisLetters.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="rounded border border-panel-border bg-panel p-3">
        <p className="text-xs tracking-widest text-ink-muted uppercase">Phonetic callsign</p>
        <p className="font-mono-panel text-sm text-hud">{toPhonetic(aircraft.tailNumber)}</p>
      </div>

      <div className="space-y-3">
        <div className="rounded border border-hud/30 bg-hud/5 p-3">
          <p className="text-xs font-semibold text-hud uppercase">You say</p>
          <p className="mt-1 font-mono-panel text-sm text-ink">{pilotCall}</p>
        </div>
        <div className="rounded border border-advisory/30 bg-advisory/5 p-3">
          <p className="text-xs font-semibold text-advisory uppercase">ATC responds</p>
          <p className="mt-1 font-mono-panel text-sm text-ink">{atcResponse}</p>
        </div>
        {readback && (
          <div className="rounded border border-normal/30 bg-normal/5 p-3">
            <p className="text-xs font-semibold text-normal uppercase">Your readback</p>
            <p className="mt-1 font-mono-panel text-sm text-ink">{readback}</p>
          </div>
        )}
        <p className="text-xs text-ink-muted">{intention.explanation}</p>
      </div>
    </div>
  );
}

const INSTRUMENTS = [
  {
    id: "asi",
    name: "Airspeed Indicator",
    system: "Pitot-Static",
    detail: "Measures ram air pressure from the pitot tube minus static pressure. Shows indicated airspeed (IAS). Block the pitot and the ASI drops toward zero; block static and it lies.",
    color: "#38bdf8",
  },
  {
    id: "ai",
    name: "Attitude Indicator",
    system: "Gyroscopic (Vacuum/Electric)",
    detail: "A gyroscope keeps a stable horizon reference. Shows pitch and bank. Vacuum-driven on many trainers; electric on glass panels. Precession and vacuum failure degrade accuracy.",
    color: "#a78bfa",
  },
  {
    id: "alt",
    name: "Altimeter",
    system: "Pitot-Static",
    detail: "An aneroid wafer expands/contracts with static pressure changes. Set the local altimeter setting (from ATIS/ATC) in the Kollsman window for accurate altitude.",
    color: "#34d399",
  },
  {
    id: "tc",
    name: "Turn Coordinator",
    system: "Gyroscopic (Electric)",
    detail: "Shows rate of turn and inclines to suggest coordination. The miniature airplane shows bank; the ball shows slip/skid — step on the ball.",
    color: "#fbbf24",
  },
  {
    id: "hi",
    name: "Heading Indicator",
    system: "Gyroscopic (Vacuum/Electric)",
    detail: "A gyroscopic compass that doesn't oscillate like the magnetic compass. Must be periodically aligned to the magnetic compass because it precesses.",
    color: "#f472b6",
  },
  {
    id: "vsi",
    name: "Vertical Speed Indicator",
    system: "Pitot-Static",
    detail: "Measures rate of change of static pressure. Shows climb/descent in feet per minute. Has a slight lag (6–9 seconds) by design.",
    color: "#fb923c",
  },
];

function InstrumentFace({ id }: { id: string }) {
  const cx = 60;
  const cy = 60;
  const r = 50;
  if (id === "asi") {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <circle cx={cx} cy={cy} r={r} fill="#0b1120" stroke="#38bdf8" strokeWidth={2} />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#e2e8f0" fontSize={14} fontFamily="monospace">120</text>
        <text x={cx} y={cy - 20} textAnchor="middle" fill="#94a3b8" fontSize={8}>KT</text>
        <line x1={cx} y1={cy} x2={cx} y2={cy - 35} stroke="#f87171" strokeWidth={2} />
      </svg>
    );
  }
  if (id === "ai") {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <circle cx={cx} cy={cy} r={r} fill="#0b1120" stroke="#a78bfa" strokeWidth={2} />
        <rect x={10} y={55} width={100} height={30} fill="#1e3a5f" />
        <line x1={10} y1={55} x2={110} y2={55} stroke="#fbbf24" strokeWidth={2} />
        <polygon points={`${cx},45 ${cx - 12},65 ${cx + 12},65`} fill="#e2e8f0" />
      </svg>
    );
  }
  if (id === "alt") {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <circle cx={cx} cy={cy} r={r} fill="#0b1120" stroke="#34d399" strokeWidth={2} />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#e2e8f0" fontSize={13} fontFamily="monospace">3,500</text>
        <text x={cx} y={cy + 22} textAnchor="middle" fill="#94a3b8" fontSize={7}>29.92</text>
        <line x1={cx} y1={cy} x2={cx + 30} y2={cy - 20} stroke="#34d399" strokeWidth={2} />
      </svg>
    );
  }
  if (id === "tc") {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <rect x={15} y={25} width={90} height={70} rx={8} fill="#0b1120" stroke="#fbbf24" strokeWidth={2} />
        <line x1={30} y1={60} x2={90} y2={60} stroke="#475569" />
        <polygon points="60,45 50,65 70,65" fill="#e2e8f0" />
        <circle cx={75} cy={75} r={5} fill="#e2e8f0" />
      </svg>
    );
  }
  if (id === "hi") {
    return (
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <circle cx={cx} cy={cy} r={r} fill="#0b1120" stroke="#f472b6" strokeWidth={2} />
        <text x={cx} y={cy - 30} textAnchor="middle" fill="#94a3b8" fontSize={8}>N</text>
        <text x={cx} y={cy + 38} textAnchor="middle" fill="#94a3b8" fontSize={8}>S</text>
        <line x1={cx} y1={cy} x2={cx} y2={cy - 38} stroke="#f472b6" strokeWidth={2} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full">
      <circle cx={cx} cy={cy} r={r} fill="#0b1120" stroke="#fb923c" strokeWidth={2} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#e2e8f0" fontSize={13} fontFamily="monospace">+500</text>
      <line x1={cx} y1={cy} x2={cx + 25} y2={cy - 15} stroke="#fb923c" strokeWidth={2} />
    </svg>
  );
}

function SixPack() {
  const [selected, setSelected] = useState(INSTRUMENTS[0].id);
  const inst = INSTRUMENTS.find((i) => i.id === selected)!;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {INSTRUMENTS.map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => setSelected(i.id)}
            className={`rounded-lg border p-2 transition-all duration-300 ${
              selected === i.id ? "border-hud bg-hud/10" : "border-panel-border bg-panel hover:border-hud/40"
            }`}
          >
            <div className="mx-auto h-24 w-24">
              <InstrumentFace id={i.id} />
            </div>
            <p className="mt-1 text-center text-xs text-ink">{i.name}</p>
          </button>
        ))}
      </div>
      <div className="rounded border border-panel-border bg-panel p-4">
        <p className="text-sm font-semibold text-ink">{inst.name}</p>
        <p className="mt-1 text-xs text-hud">Power source: {inst.system}</p>
        <p className="mt-2 text-sm text-ink-muted">{inst.detail}</p>
        <div className="mt-3 flex gap-2">
          {INSTRUMENTS.filter((i) => i.system.startsWith("Pitot")).map((i) => (
            <span key={i.id} className={`rounded px-2 py-0.5 text-xs ${i.id === inst.id ? "bg-hud/20 text-hud" : "text-ink-muted"}`}>
              {i.name}
            </span>
          ))}
          <span className="text-ink-muted">|</span>
          {INSTRUMENTS.filter((i) => i.system.startsWith("Gyro")).map((i) => (
            <span key={i.id} className={`rounded px-2 py-0.5 text-xs ${i.id === inst.id ? "bg-hud/20 text-hud" : "text-ink-muted"}`}>
              {i.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetarDecoder() {
  const [input, setInput] = useState(SAMPLE_METARS[0].raw);
  const tokens = decodeMetar(input);

  return (
    <div className="space-y-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        placeholder="Paste a METAR string…"
        className="w-full rounded border border-panel-border bg-panel p-3 font-mono-panel text-sm text-ink outline-none transition-all duration-300 focus:border-hud"
      />
      <div className="flex flex-wrap gap-2">
        {SAMPLE_METARS.map((s) => (
          <button
            key={s.raw}
            type="button"
            onClick={() => setInput(s.raw)}
            className="rounded border border-panel-border px-2 py-1 text-xs text-ink-muted transition-all duration-300 hover:border-hud hover:text-hud"
            title={s.note}
          >
            {s.raw.slice(0, 20)}…
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {tokens.map((t, i) => (
          <span
            key={`${t.raw}-${i}`}
            title={t.detail}
            className={`cursor-help rounded border px-2 py-1 font-mono-panel text-xs transition-all duration-300 ${
              t.kind === "unknown"
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-hud/30 bg-hud/5 text-hud"
            }`}
          >
            {t.raw}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {tokens.map((t, i) => (
          <div key={`detail-${i}`} className="rounded border border-panel-border bg-panel p-2 text-sm">
            <span className="font-mono-panel text-hud">{t.raw}</span>
            <span className="mx-2 text-ink-muted">→</span>
            <span className="text-ink">{t.meaning}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { id: "atc", label: "ATC Comm Sandbox" },
  { id: "sixpack", label: "6-Pack Instruments" },
  { id: "metar", label: "METAR Decoder" },
] as const;

export function SimulatorLabPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("atc");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Simulator Lab</h1>
        <p className="text-sm text-ink-muted">Hands-on tools for radio work, instruments, and weather.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded border px-3 py-1.5 text-sm transition-all duration-300 ${
              tab === t.id ? "border-hud bg-hud/15 text-hud" : "border-panel-border text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Panel>
        {tab === "atc" && <AtcSandbox />}
        {tab === "sixpack" && <SixPack />}
        {tab === "metar" && <MetarDecoder />}
      </Panel>
    </div>
  );
}
