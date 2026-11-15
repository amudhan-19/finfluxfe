// @author  veera
// @file    constants/uiText.ts
//
// Shared punctuation & simple symbols as \u escapes so labels stay correct
// regardless of editor/source-file encoding (ASCII \\u escapes used in U.*)

export const U = {
  mid: '\u00B7',
  ndash: '\u2013',
  mdash: '\u2014',
  ellip: '\u2026',
  arr: '\u2192',
  arrBi: '\u2194',
  arrRet: '\u21A9',
  arrHook: '\u21B3',
  bull: '\u2022',
  times: '\u00D7',
  chev: '\u203A',
  check: '\u2713',
  x: '\u2715',
  gear: '\u2699',
  sync: '\u21BB',
  warn: '\u26A0',
  tri: '\u25B8',
  triDn: '\u25BC',
  triRt: '\u25B6',
  circ: '\u25CB',
  pen: '\u270E',
  spark: '\u2728',
  empt: '\u2014',
  info: '\u2139',
  scales: '\u2696',
  orth: '\u229E',
  diamond: '\u25C6',
  /** BMP padlock pictograph */
  lock: '\uD83D\uDD12',
  triUp: '\u25B2',
  navL: '\u25C0',
  /** High-voltage sign (lightning bolt) */
  bolt: '\u26A1',
} as const
