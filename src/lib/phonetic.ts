/** ICAO phonetic alphabet + aviation number pronunciation helpers. */

export const PHONETIC_LETTERS: Record<string, string> = {
  A: "Alpha",
  B: "Bravo",
  C: "Charlie",
  D: "Delta",
  E: "Echo",
  F: "Foxtrot",
  G: "Golf",
  H: "Hotel",
  I: "India",
  J: "Juliett",
  K: "Kilo",
  L: "Lima",
  M: "Mike",
  N: "November",
  O: "Oscar",
  P: "Papa",
  Q: "Quebec",
  R: "Romeo",
  S: "Sierra",
  T: "Tango",
  U: "Uniform",
  V: "Victor",
  W: "Whiskey",
  X: "X-ray",
  Y: "Yankee",
  Z: "Zulu",
};

export const PHONETIC_DIGITS: Record<string, string> = {
  "0": "Zero",
  "1": "One",
  "2": "Two",
  "3": "Tree",
  "4": "Fower",
  "5": "Fife",
  "6": "Six",
  "7": "Seven",
  "8": "Eight",
  "9": "Niner",
};

/** "N738GB" -> "November Seven Tree Eight Golf Bravo" */
export function toPhonetic(input: string): string {
  return input
    .toUpperCase()
    .split("")
    .map((ch) => PHONETIC_LETTERS[ch] ?? PHONETIC_DIGITS[ch] ?? ch)
    .filter((w) => w.trim().length > 0)
    .join(" ");
}
