/**
 * METAR tokenizer / decoder (UI-side).
 *
 * Splits a raw METAR into whitespace tokens and decodes each into a
 * human-readable explanation. Unknown tokens are flagged rather than dropped.
 */

export type MetarTokenKind =
  | "type"
  | "station"
  | "time"
  | "auto"
  | "wind"
  | "wind-variable"
  | "visibility"
  | "runway-visual-range"
  | "weather"
  | "sky"
  | "temp-dew"
  | "altimeter"
  | "remarks"
  | "remark-detail"
  | "unknown";

export interface DecodedToken {
  raw: string;
  kind: MetarTokenKind;
  /** Short label, e.g. "Wind". */
  label: string;
  /** One-line human-readable decode. */
  meaning: string;
  /** Longer beginner-facing explanation for tooltip/expanded view. */
  detail: string;
}

const WEATHER_DESCRIPTORS: Record<string, string> = {
  MI: "shallow",
  PR: "partial",
  BC: "patches of",
  DR: "low drifting",
  BL: "blowing",
  SH: "showers of",
  TS: "thunderstorm with",
  FZ: "freezing",
};

const WEATHER_PHENOMENA: Record<string, string> = {
  DZ: "drizzle",
  RA: "rain",
  SN: "snow",
  SG: "snow grains",
  IC: "ice crystals",
  PL: "ice pellets",
  GR: "hail",
  GS: "small hail / snow pellets",
  UP: "unknown precipitation",
  BR: "mist",
  FG: "fog",
  FU: "smoke",
  VA: "volcanic ash",
  DU: "widespread dust",
  SA: "sand",
  HZ: "haze",
  PY: "spray",
  PO: "dust/sand whirls",
  SQ: "squalls",
  FC: "funnel cloud",
  SS: "sandstorm",
  DS: "duststorm",
  TS: "thunderstorm",
};

const CLOUD_COVER: Record<string, { name: string; oktas: string }> = {
  SKC: { name: "Sky clear", oktas: "0/8 (manual report)" },
  CLR: { name: "Clear", oktas: "no clouds below 12,000 ft (automated)" },
  NCD: { name: "No cloud detected", oktas: "automated station" },
  NSC: { name: "No significant cloud", oktas: "" },
  FEW: { name: "Few clouds", oktas: "1/8 to 2/8 coverage" },
  SCT: { name: "Scattered clouds", oktas: "3/8 to 4/8 coverage" },
  BKN: { name: "Broken clouds", oktas: "5/8 to 7/8 coverage — this is a ceiling" },
  OVC: { name: "Overcast", oktas: "8/8 full coverage — this is a ceiling" },
  VV: { name: "Vertical visibility", oktas: "sky obscured; ceiling is vertical visibility" },
};

function decodeWeatherToken(raw: string): DecodedToken | null {
  const m = raw.match(/^(\+|-|VC)?((?:MI|PR|BC|DR|BL|SH|TS|FZ)?)((?:DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS|TS){1,3})$/);
  if (!m) return null;
  const [, intensity, descriptor, phenomenaStr] = m;
  const parts: string[] = [];
  if (intensity === "+") parts.push("heavy");
  else if (intensity === "-") parts.push("light");
  else if (intensity === "VC") parts.push("in the vicinity:");
  else if (phenomenaStr !== "TS") parts.push("moderate");
  if (descriptor) parts.push(WEATHER_DESCRIPTORS[descriptor]);
  const phen: string[] = [];
  for (let i = 0; i < phenomenaStr.length; i += 2) {
    const code = phenomenaStr.slice(i, i + 2);
    phen.push(WEATHER_PHENOMENA[code] ?? code);
  }
  parts.push(phen.join(" and "));
  const meaning = parts.join(" ").replace(/\s+/g, " ").trim();
  return {
    raw,
    kind: "weather",
    label: "Weather",
    meaning: meaning.charAt(0).toUpperCase() + meaning.slice(1),
    detail:
      "Present weather codes combine an intensity prefix (- light, + heavy, VC in the vicinity, none = moderate), an optional descriptor (SH showers, TS thunderstorm, FZ freezing...), and one or more phenomena (RA rain, SN snow, BR mist, FG fog...).",
  };
}

function decodeSkyToken(raw: string): DecodedToken | null {
  const simple = raw.match(/^(SKC|CLR|NCD|NSC)$/);
  if (simple) {
    const info = CLOUD_COVER[simple[1]];
    return {
      raw,
      kind: "sky",
      label: "Sky condition",
      meaning: `${info.name}${info.oktas ? ` — ${info.oktas}` : ""}`,
      detail:
        "Sky condition reports cloud coverage in eighths (oktas). CLR/SKC mean no significant clouds; automated stations report CLR when nothing is detected below 12,000 ft.",
    };
  }
  const layered = raw.match(/^(FEW|SCT|BKN|OVC|VV)(\d{3})(CB|TCU)?$/);
  if (!layered) return null;
  const [, cover, height, convective] = layered;
  const info = CLOUD_COVER[cover];
  const feet = parseInt(height, 10) * 100;
  let meaning = `${info.name} at ${feet.toLocaleString()} ft AGL`;
  if (cover === "VV") meaning = `Sky obscured — vertical visibility ${feet.toLocaleString()} ft`;
  if (convective === "CB") meaning += " (cumulonimbus — thunderstorm cloud)";
  if (convective === "TCU") meaning += " (towering cumulus)";
  return {
    raw,
    kind: "sky",
    label: "Sky condition",
    meaning,
    detail: `Coverage ${info.oktas || "n/a"}. The three digits are height above ground level in hundreds of feet: ${height} = ${feet.toLocaleString()} ft AGL. BKN and OVC layers count as a ceiling.`,
  };
}

function decodeOne(raw: string, inRemarks: boolean): DecodedToken {
  if (inRemarks) {
    return {
      raw,
      kind: "remark-detail",
      label: "Remark",
      meaning: "Additional remark data",
      detail:
        "Everything after RMK is the remarks section: station type (AO2), precise sea-level pressure (SLPxxx), hourly temperature (Txxxxxxxx), and other supplementary observations.",
    };
  }

  if (/^(METAR|SPECI)$/.test(raw)) {
    return {
      raw,
      kind: "type",
      label: "Report type",
      meaning: raw === "METAR" ? "Routine hourly weather report" : "Special (unscheduled) report — conditions changed significantly",
      detail: "METAR reports are issued hourly. A SPECI is issued between hours whenever weather changes past certain thresholds.",
    };
  }

  if (raw === "AUTO") {
    return {
      raw,
      kind: "auto",
      label: "Modifier",
      meaning: "Fully automated report (no human observer)",
      detail: "AUTO means the observation came from an automated station with no human augmentation.",
    };
  }

  if (raw === "COR") {
    return {
      raw,
      kind: "auto",
      label: "Modifier",
      meaning: "Corrected report",
      detail: "COR flags a correction to a previously disseminated observation.",
    };
  }

  if (raw === "RMK") {
    return {
      raw,
      kind: "remarks",
      label: "Remarks",
      meaning: "Start of the remarks section",
      detail: "RMK separates the main body of the METAR from supplementary machine- and observer-generated remarks.",
    };
  }

  const time = raw.match(/^(\d{2})(\d{2})(\d{2})Z$/);
  if (time) {
    const [, day, hh, mm] = time;
    return {
      raw,
      kind: "time",
      label: "Day / time",
      meaning: `Observed on day ${parseInt(day, 10)} of the month at ${hh}:${mm} Zulu (UTC)`,
      detail: "Two digits for the day of the month, four digits for the time, always in UTC (\"Zulu\"). Aviation runs on one global clock.",
    };
  }

  const wind = raw.match(/^(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?(KT|MPS)$/);
  if (wind) {
    const [, dir, speed, gust, unit] = wind;
    const u = unit === "KT" ? "knots" : "meters/second";
    const spd = parseInt(speed, 10);
    let meaning: string;
    if (spd === 0 && dir === "000") {
      meaning = "Wind calm";
    } else if (dir === "VRB") {
      meaning = `Wind variable in direction at ${spd} ${u}`;
    } else {
      meaning = `Wind from ${dir}° true at ${spd} ${u}`;
    }
    if (gust) meaning += `, gusting to ${parseInt(gust, 10)} ${u}`;
    return {
      raw,
      kind: "wind",
      label: "Wind",
      meaning,
      detail:
        "First three digits: direction the wind is blowing FROM, in degrees true (VRB = variable, light winds). Next digits: sustained speed. G##: gust peak. 00000KT means calm.",
    };
  }

  const windVar = raw.match(/^(\d{3})V(\d{3})$/);
  if (windVar) {
    return {
      raw,
      kind: "wind-variable",
      label: "Wind variability",
      meaning: `Wind direction varying between ${windVar[1]}° and ${windVar[2]}°`,
      detail: "Reported when wind direction varies by 60° or more and speed is above 6 knots. Read it together with the wind group before it.",
    };
  }

  const vis = raw.match(/^(M)?(\d{1,2}|\d\/\d|\d\s?\d\/\d)SM$/) ?? raw.match(/^(M)?(\d{1,2}(?:\s\d\/\d)?|\d\/\d)SM$/);
  if (vis) {
    const lessThan = vis[1] === "M" ? "less than " : "";
    return {
      raw,
      kind: "visibility",
      label: "Visibility",
      meaning: `Visibility ${lessThan}${vis[2]} statute mile${vis[2] === "1" ? "" : "s"}`,
      detail:
        "Prevailing visibility in statute miles (SM). An M prefix means \"less than\". 10SM is the maximum an automated station reports — effectively unlimited.",
    };
  }
  if (/^\d{4}$/.test(raw) && parseInt(raw, 10) <= 9999) {
    // International-style meters visibility (e.g. 9999). Only match after wind
    // groups have been ruled out above.
    const meters = parseInt(raw, 10);
    return {
      raw,
      kind: "visibility",
      label: "Visibility",
      meaning: meters === 9999 ? "Visibility 10 km or more" : `Visibility ${meters.toLocaleString()} meters`,
      detail: "Outside the U.S., visibility is reported as a four-digit value in meters. 9999 means 10 kilometers or more.",
    };
  }

  const rvr = raw.match(/^R(\d{2}[LRC]?)\/([MP]?\d{4})(?:V([MP]?\d{4}))?FT$/);
  if (rvr) {
    return {
      raw,
      kind: "runway-visual-range",
      label: "Runway visual range",
      meaning: `RVR for runway ${rvr[1]}: ${rvr[2].replace("M", "below ").replace("P", "above ")} ft${rvr[3] ? ` varying to ${rvr[3].replace("M", "below ").replace("P", "above ")} ft` : ""}`,
      detail: "Runway Visual Range: how far down the runway a pilot can see, measured by transmissometers. P = more than, M = less than.",
    };
  }

  const sky = decodeSkyToken(raw);
  if (sky) return sky;

  const wx = decodeWeatherToken(raw);
  if (wx) return wx;

  const tempDew = raw.match(/^(M?\d{2})\/(M?\d{2})?$/);
  if (tempDew) {
    const t = tempDew[1].startsWith("M") ? -parseInt(tempDew[1].slice(1), 10) : parseInt(tempDew[1], 10);
    const dRaw = tempDew[2];
    const d = dRaw ? (dRaw.startsWith("M") ? -parseInt(dRaw.slice(1), 10) : parseInt(dRaw, 10)) : null;
    return {
      raw,
      kind: "temp-dew",
      label: "Temperature / dew point",
      meaning: `Temperature ${t}°C, dew point ${d === null ? "missing" : `${d}°C`}${d !== null && t - d <= 3 ? " — temp/dew point close: fog or low clouds likely" : ""}`,
      detail:
        "Both values are in whole degrees Celsius; an M prefix means minus (below zero). When temperature and dew point converge, the air is near saturation — expect mist, fog, or low clouds.",
    };
  }

  const altim = raw.match(/^A(\d{4})$/);
  if (altim) {
    const inches = (parseInt(altim[1], 10) / 100).toFixed(2);
    return {
      raw,
      kind: "altimeter",
      label: "Altimeter",
      meaning: `Altimeter setting ${inches} inHg`,
      detail: `Dial ${inches} into the Kollsman window of your altimeter so it reads correct altitude. Standard pressure is 29.92 inHg.`,
    };
  }
  const qnh = raw.match(/^Q(\d{4})$/);
  if (qnh) {
    return {
      raw,
      kind: "altimeter",
      label: "Altimeter (QNH)",
      meaning: `Altimeter setting ${parseInt(qnh[1], 10)} hPa`,
      detail: "International stations report the altimeter setting (QNH) in hectopascals instead of inches of mercury. Standard is 1013 hPa.",
    };
  }

  if (/^[A-Z][A-Z0-9]{3}$/.test(raw)) {
    return {
      raw,
      kind: "station",
      label: "Station",
      meaning: `Reporting station ${raw}${raw.startsWith("K") ? " (U.S. airport — ICAO code)" : ""}`,
      detail:
        "The four-letter ICAO identifier of the reporting airport. U.S. airports prefix their three-letter code with K: JFK becomes KJFK.",
    };
  }

  return {
    raw,
    kind: "unknown",
    label: "Unrecognized",
    meaning: "Not a token this decoder recognizes",
    detail:
      "This token doesn't match any pattern the decoder knows. It may be a less-common group (military color codes, sea state, trend forecasts) or a typo.",
  };
}

export function decodeMetar(input: string): DecodedToken[] {
  const cleaned = input.trim().replace(/[\r\n]+/g, " ").replace(/\s+/g, " ");
  if (!cleaned) return [];
  const rawTokens = cleaned.split(" ");

  // Re-join fractional visibility like "1 1/2SM" into a single token.
  const tokens: string[] = [];
  for (let i = 0; i < rawTokens.length; i++) {
    const cur = rawTokens[i];
    const next = rawTokens[i + 1];
    if (/^\d$/.test(cur) && next && /^\d\/\dSM$/.test(next)) {
      tokens.push(`${cur} ${next}`);
      i++;
    } else {
      tokens.push(cur);
    }
  }

  let inRemarks = false;
  let stationSeen = false;
  return tokens.map((tok) => {
    const decoded = decodeOne(tok, inRemarks);
    if (decoded.kind === "remarks") inRemarks = true;
    // The very first plain 4-letter group is the station; later ones would be
    // misparsed weather groups, so only accept a station once.
    if (decoded.kind === "station") {
      if (stationSeen) {
        return {
          raw: tok,
          kind: "unknown" as const,
          label: "Unrecognized",
          meaning: "Not a token this decoder recognizes",
          detail: "Looked like a station identifier, but the station was already decoded earlier in this METAR.",
        };
      }
      stationSeen = true;
    }
    return decoded;
  });
}

export const SAMPLE_METARS = [
  { raw: "KJFK 121651Z 19012G20KT 10SM CLR 22/14 A3002", note: "Clear summer day at JFK with gusty south wind" },
  { raw: "KPDX 101953Z 27008KT 6SM -RA BR BKN015 OVC025 12/10 A2989", note: "Typical Pacific Northwest light rain and mist" },
  { raw: "KDEN 052253Z 35022G35KT 2SM +TSRA BKN008CB M02/M04 A2965", note: "Nasty: thunderstorm, heavy rain, freezing temps" },
];
