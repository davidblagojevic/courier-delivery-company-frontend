/* eslint-disable no-console -- this module is the single allowed console wrapper */
const enabled = import.meta.env.DEV;

export const log = {
  info: (...args: unknown[]) => {
    if (enabled) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (enabled) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
