/**
 * Scheduling and unscheduling (cancellation) of feedback checks
 */

import { IFeedbackContext, IFeedbackOpts, IDisposableLike, IScheduleFeedbackChecksApi } from "./types";
import { initState, getFeedbackCheckTimeoutId, setFeedbackCheckTimeoutId } from "./state";
import { defaultTimings } from "./timings";
import { defaultText } from "./l10n";
import { checkForFeedback } from "./checker";

/**
 * Initiate feedback checking.
 */
export async function scheduleFeedbackChecks(
  vscodeApi: IScheduleFeedbackChecksApi,
  feedbackContext: IFeedbackContext,
  opts: IFeedbackOpts,
): Promise<IDisposableLike> {

  initState(feedbackContext.memento);

  // Just to be defensive, make sure this hasn't been called before.
  if (getFeedbackCheckTimeoutId() !== null) {
    throw "scheduleFeedbackChecks called twice";
  }

  // Apply default timings if applicable.
  opts.timings = Object.assign(defaultTimings, opts.timings || {});

  // Apply default text if applicable.
  opts.localizedText = Object.assign(defaultText, opts.localizedText || {});

  // Start the checking sequence.
  await checkForFeedback(vscodeApi, feedbackContext, opts);

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
  const feedbackCheckTimeoutId = getFeedbackCheckTimeoutId();
  if (feedbackCheckTimeoutId !== null) {
    clearTimeout(feedbackCheckTimeoutId);
    setFeedbackCheckTimeoutId(null);
  }
}
