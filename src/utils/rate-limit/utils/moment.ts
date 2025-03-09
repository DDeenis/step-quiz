type TimeLiteral = "ms" | "s" | "m" | "h" | "d" | "w" | "mt" | "y";

const multipliers: Record<TimeLiteral, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  mt: 31 * 7 * 24 * 60 * 60 * 1000,
  y: 365 * 7 * 24 * 60 * 60 * 1000,
};

export class Moment {
  static from(timeString: `${number}${TimeLiteral}`) {
    const number = parseInt(timeString);
    const literal = timeString.slice(number.toString().length) as TimeLiteral;
    return number * multipliers[literal];
  }
}
