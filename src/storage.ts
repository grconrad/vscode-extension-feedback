/**
 * State persisted to disk
 */

// Keys in persisted state where we remember timing information across VS Code invocations
export const KEY_LAST_FEEDBACK = "feedback.lastResponseTime";
export const KEY_DONT_ASK = "feedback.dontAskAgain";
export const KEY_FIRST_CHECKED = "feedback.firstCheckedTime";
export const KEY_LAST_ASKED = "feedback.lastAskedTime";

export const ALL_KEYS = [
  KEY_LAST_FEEDBACK,
  KEY_DONT_ASK,
  KEY_FIRST_CHECKED,
  KEY_LAST_ASKED
];
