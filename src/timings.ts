/**
 * Timings of feedback checks / prompts
 */

import { ITimings } from "./types";

// Once per day, see if we need to do anything
const DEFAULT_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

// If user hasn't said "don't ask me again", and has never given feedback, but has been using the
// extension for at least this long, then ask on the next "check".
const DEFAULT_FIRST_ASK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

// If user hasn't said "don't ask me again", and has never given feedback, and it has been at least
// this long since we last asked for feedback, then ask again on the next "check".
const DEFAULT_REMINDER_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

export const defaultTimings: ITimings = {
  checkInterval: DEFAULT_CHECK_INTERVAL_MS,
  firstAskInterval: DEFAULT_FIRST_ASK_INTERVAL_MS,
  reminderInterval: DEFAULT_REMINDER_INTERVAL_MS
};
