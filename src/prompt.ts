import { window } from "vscode";

import { FeedbackCheckResult, IFeedbackContext } from "./types";
import { openExternalFeedbackForm } from "./commands";

const DONT_ASK_AGAIN = "Don't ask again";
const NOT_NOW = "Not now";
const OPEN_SURVEY = "Give feedback";

const buttons = [
  OPEN_SURVEY,
  NOT_NOW,
  DONT_ASK_AGAIN,
];

/**
 * @internal
 */
export async function askForFeedback(
  feedbackContext: IFeedbackContext,
  feedbackFormUrl: string
): Promise<FeedbackCheckResult> {

  const buttonClicked = await window.showInformationMessage(
    "Enjoying this extension? We'd love your feedback!",
    ...buttons
  );

  if (buttonClicked === DONT_ASK_AGAIN) {
    return FeedbackCheckResult.RESPONSE_DONT_ASK;
  } else if (buttonClicked === OPEN_SURVEY) {
    const openedSurvey = await openExternalFeedbackForm(feedbackFormUrl);
    // If there was some problem opening the survey, log it.
    // And treat this as if the user hadn't responded, since we never got feedback.
    if (!openedSurvey) {
      feedbackContext.logFn(`Error: could not open survey at ${feedbackFormUrl}`);
      return FeedbackCheckResult.NO_RESPONSE;
    }
    // If the survey was opened externally, assume the user provided feedback.
    // There's really no way to know for sure.
    return FeedbackCheckResult.RESPONSE_FEEDBACK;
  }
  return FeedbackCheckResult.NO_RESPONSE;
}
