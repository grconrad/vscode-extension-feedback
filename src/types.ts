import { Memento } from "vscode";

export interface IFeedbackContext {
  logFn: (text: string) => void;
  memento: Memento;              // for persisting preferences and state related to feedback checks
}

export interface IFeedbackOpts {
  /* External survey form */
  feedbackFormUrl: string;

  timings?: ITimings;

  /* Text for prompt and buttons */
  localizedText?: ILocalizedText;
}

export interface ILocalizedText {
  promptText?:       string; // e.g. "Enjoying this extension? We'd love your feedback!"
  giveFeedbackText?: string; // e.g. "Give feedback"
  notNowText?:       string; // e.g. "Not now"
  dontAskAgainText?: string; // e.g. "Don't ask again"
}

export interface ITimings {
  /** Minimum time to wait (milliseconds) before checking feedback status */
  checkInterval?: number;

  /**
   * Minimum time to wait (milliseconds) before we first ask for feedback.
   * This gives the user a chance to use the extension before forming an opinion about it.
   */
  firstAskInterval?: number;

  /** Minimum time to wait (milliseconds) before asking again for feedback. */
  reminderInterval?: number;
}

export enum FeedbackCheckResult {
  /** User has already given feedback */
  ALREADY_RESPONDED = "ALREADY_RESPONDED",

  /** User has previously said "don't ask me again" */
  WONT_ASK = "WONT_ASK",

  /** Too soon to ask again */
  TOO_SOON = "TOO_SOON",

  /** Asked, but user ignored prompt or said "not now" */
  NO_RESPONSE = "NO_RESPONSE",

  /** Asked, but user said "don't ask me again" */
  RESPONSE_DONT_ASK = "RESPONSE_DONT_ASK",

  /** Asked, and user opened external form (and, we hope, submitted feedback) */
  RESPONSE_FEEDBACK = "FEEDBACK",

  /** Unexpected error */
  ERROR = "ERROR",
}
