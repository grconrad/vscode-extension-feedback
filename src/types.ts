import type { Memento } from "vscode";

export interface IScheduleFeedbackChecksApi {
  windowShowInformationMessage: IShowInformationMessageLike;
  openExternalFeedbackForm: IOpenExternalFeedbackForm;
}

// Support mocking vscode.window.showInformationMessage
export interface IShowInformationMessageLike {
  (message: string, ...items: string[]): Thenable<string | undefined>;
  (message: string, options: unknown, ...items: string[]): Thenable<
    string | undefined
  >;
  // (message: string, ...items: string[]): Thenable<string | undefined>;
}
export interface IOpenExternalFeedbackForm {
  (feedbackFormUrl: string): Promise<boolean>;
}

export interface IDisposableLike {
  dispose(): void;
}

export interface IFeedbackContext {
  /* For logging */
  logFn: (text: string) => void;

  /* For persisting state related to feedback checks */
  memento: Memento;
}

export interface IFeedbackOpts {
  /* External survey form */
  feedbackFormUrl: string;

  timings?: Partial<ITimings>;

  /* Text for prompt and buttons */
  localizedText?: Partial<ILocalizedText>;
}

export interface ILocalizedText {
  /* "Enjoying this extension? We'd love your feedback!" */
  promptText: string;

  /* "Give feedback" */
  giveFeedbackText: string;

  /* "Not now" */
  notNowText: string;

  /* "Don't ask again" */
  dontAskAgainText: string;
}

export interface ITimings {
  /** Minimum time to wait (milliseconds) before checking feedback status */
  checkInterval: number;

  /**
   * Minimum time to wait (milliseconds) before we first ask for feedback.
   * This gives the user a chance to use the extension before forming an opinion about it.
   */
  firstAskInterval: number;

  /** Minimum time to wait (milliseconds) before asking again for feedback. */
  reminderInterval: number;
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
