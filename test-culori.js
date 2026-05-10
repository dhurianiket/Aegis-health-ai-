import { formatRgb, parse } from "culori";
const color = parse("oklch(0.6 0.1 250)");
console.log(formatRgb(color));
