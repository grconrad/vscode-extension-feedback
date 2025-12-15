import { ILocalizedText } from "./types";

const DEFAULT_PROMPT_TEXT = "Enjoying this extension? We'd love your feedback!";
const DEFAULT_OPEN_SURVEY_TEXT = "Give feedback";
const DEFAULT_NOT_NOW_TEXT = "Not now";
const DEFAULT_DONT_ASK_AGAIN_TEXT = "Don't ask again";

export const defaultText: ILocalizedText = {
  promptText: DEFAULT_PROMPT_TEXT,
  giveFeedbackText: DEFAULT_OPEN_SURVEY_TEXT,
  notNowText: DEFAULT_NOT_NOW_TEXT,
  dontAskAgainText: DEFAULT_DONT_ASK_AGAIN_TEXT,
};
