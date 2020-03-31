/**
 * Ask the user for feedback
 */

import { window } from "vscode";

import { FeedbackCheckResult, IFeedbackContext, IFeedbackOpts } from "./types";
import { openExternalFeedbackForm } from "./commands";

/**
 * Prompt user for feedback using an info message.
 */
export async function askForFeedback(
  feedbackContext: IFeedbackContext,
  opts: IFeedbackOpts
): Promise<FeedbackCheckResult> {

  const {promptText, giveFeedbackText, notNowText, dontAskAgainText} = opts.localizedText!;

  const buttonClicked = await window.showInformationMessage(
    promptText!,
    giveFeedbackText!,
    notNowText!,
    dontAskAgainText!
  );

  if (buttonClicked === dontAskAgainText) {
    return FeedbackCheckResult.RESPONSE_DONT_ASK;
  } else if (buttonClicked === giveFeedbackText) {
    const openedSurvey = await openExternalFeedbackForm(opts.feedbackFormUrl);
    // If there was some problem opening the survey, log it.
    // And treat this as if the user hadn't responded, since we never got feedback.
    if (!openedSurvey) {
      feedbackContext.logFn(`Error: could not open survey at ${opts.feedbackFormUrl}`);
      return FeedbackCheckResult.NO_RESPONSE;
    }
    // If the survey was opened externally, assume the user provided feedback.
    // There's really no way to know for sure.
    return FeedbackCheckResult.RESPONSE_FEEDBACK;
  }
  return FeedbackCheckResult.NO_RESPONSE;
}
