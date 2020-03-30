/* Scheduling and unscheduling (cancellation) of feedback checks */

import { Disposable } from "vscode";

import { getFeedbackCheckTimeoutId, setFeedbackCheckTimeoutId } from "./state";
import { IFeedbackContext, IFeedbackOpts } from "./types";
import { defaultTimings } from "./timings";
import { defaultText } from "./l10n";
import { checkForFeedback } from "./checker";

/**
 * Initiate feedback checking.
 */
export async function scheduleFeedbackChecks(
  feedbackContext: IFeedbackContext,
  opts: IFeedbackOpts
): Promise<Disposable> {

  // Just to be defensive, make sure this hasn't been called before.
  const feedbackCheckTimeoutId = getFeedbackCheckTimeoutId();
  if (feedbackCheckTimeoutId !== null) {
    throw "scheduleFeedbackChecks called twice";
  }

  // Apply default timings if applicable.
  opts.timings = Object.assign(defaultTimings, opts.timings || {});

  // Apply default text if applicable.
  opts.localizedText = Object.assign(defaultText, opts.localizedText || {});

  // Start the checking sequence.
  await checkForFeedback(feedbackContext, opts);

  // Return a disposable.
  return {
    dispose: (): void => {
      unscheduleFeedbackChecks();
    }
  };
}

/**
 * Cancel any pending (scheduled) feedback check.
 */
function unscheduleFeedbackChecks(): void {
  let feedbackCheckTimeoutId = getFeedbackCheckTimeoutId();
  if (feedbackCheckTimeoutId !== null) {
    clearTimeout(feedbackCheckTimeoutId);
    setFeedbackCheckTimeoutId(null);
  }
}
