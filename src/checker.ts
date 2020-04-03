/**
 * The brain of the feedback checking mechanism
 *
 * Refactored to support unit tests
 */

import { IFeedbackContext, FeedbackCheckResult, IFeedbackOpts, IScheduleFeedbackChecksApi } from "./types";
import {
  getDontAsk,
  getFirstCheckedTime,
  getLastAskedTime,
  getLastFeedbackTime,
  setFeedbackCheckTimeoutId,
  updateDontAsk,
  updateFirstCheckedTime,
  updateLastAskedTime,
  updateLastFeedbackTime,
} from "./state";
import { askForFeedback } from "./prompt";

/**
 * Check whether anything needs to be done for feedback gathering. If it's appropriate to ask for
 * feedback, do that now. Then schedule the next feedback check, if appropriate.
 *
 * If the user closes the prompt or clicks "Not now", schedule the next check and stash the timeout
 * id.
 */
export async function checkForFeedback(
  vscodeApi: IScheduleFeedbackChecksApi,
  feedbackContext: IFeedbackContext,
  opts: IFeedbackOpts,
): Promise<void> {

  const logFn = feedbackContext.logFn;

  const result: FeedbackCheckResult = await checkNow(vscodeApi, feedbackContext, opts);
  logFn(`Result of feedback check: ${result}`);

  switch (result) {
  case FeedbackCheckResult.ALREADY_RESPONDED:
  case FeedbackCheckResult.WONT_ASK:
  case FeedbackCheckResult.RESPONSE_DONT_ASK:
  case FeedbackCheckResult.RESPONSE_FEEDBACK:
    // In these cases, the user has already given feedback or indicated that they won't.
    // Respect their wishes.
    // Don't schedule another check.
    setFeedbackCheckTimeoutId(null);
    return;
  }

  // If we made it here, we haven't heard from the user.
  // Go ahead and schedule the next check.
  const checkInterval = opts.timings!.checkInterval!;
  logFn(`Next feedback check scheduled for ${new Date(Date.now() + checkInterval).toISOString()}`);
  const feedbackCheckTimeoutId = setTimeout(() => {
    checkForFeedback(vscodeApi, feedbackContext, opts);
  }, checkInterval);
  // Hang onto timeout id.
  setFeedbackCheckTimeoutId(feedbackCheckTimeoutId);
}

/**
 * Should we prompt for feedback now? Read persisted state to find out. If we should ask, do it.
 *
 * This function is responsible for updating state (in memory and persisted).
 *
 * This function is NOT responsible for scheduling the next feedback check (if any). It's only
 * responsible for performing a single check and handing the result back to the caller.
 *
 * @returns Result of the check, typically a reason why we didn't ask for feedback or the result
 *   from asking
 */
export async function checkNow(
  vscodeApi: IScheduleFeedbackChecksApi,
  feedbackContext: IFeedbackContext,
  opts: IFeedbackOpts
): Promise<FeedbackCheckResult> {

  const {logFn} = feedbackContext;

  try {

    // Read persisted state.

    // If user has already provided feedback, don't ask anymore.
    if (getLastFeedbackTime() !== undefined) {
      logFn("Skipping feedback prompt (feedback already provided)");
      return FeedbackCheckResult.ALREADY_RESPONDED;
    }

    // If user has said "don't ask again", respect that.
    if (getDontAsk()) {
      logFn("Skipping feedback prompt (user doesn't want to be asked again)");
      return FeedbackCheckResult.WONT_ASK;
    }

    const checkTime = Date.now();

    // Have we ever run the feedback check?
    const firstCheckedTime = getFirstCheckedTime();

    // If we've never asked, don't ask now. This is the first time the feedback check is running,
    // and probably the first time the extension is running. The user hasn't had enough time to use
    // it and form an opinion.
    if (firstCheckedTime === undefined) {
      updateFirstCheckedTime(checkTime);
      logFn("Skipping feedback prompt (too soon for first ask)");
      return FeedbackCheckResult.TOO_SOON;
    }

    // We've run a check before, but might or might not have actually asked for feedback.

    const lastAskedTime = getLastAskedTime();
    const { firstAskInterval, reminderInterval } = opts.timings!;

    if (lastAskedTime === undefined && ((checkTime - firstCheckedTime) < firstAskInterval!)) {
      // We've never asked for feedback, but it's too soon for the first ask.
      logFn("Skipping feedback prompt (too soon for first ask)");
      return FeedbackCheckResult.TOO_SOON;
    }

    if (lastAskedTime !== undefined && ((checkTime - lastAskedTime) < reminderInterval!)) {
      // We've asked for feedback before, but it's too soon for a reminder.
      logFn("Skipping feedback prompt (too soon for reminder)");
      return FeedbackCheckResult.TOO_SOON;
    }

    // Either we've never asked for feedback, or it was awhile ago.
    // Ask now.
    updateLastAskedTime(Date.now());
    const result = await askForFeedback(vscodeApi, feedbackContext, opts);
    if (result === FeedbackCheckResult.RESPONSE_DONT_ASK) {
      updateDontAsk(true);
    } else if (result === FeedbackCheckResult.RESPONSE_FEEDBACK) {
      updateLastFeedbackTime(Date.now());
    }
    return result;
  }
  catch (e) {
    logFn("Error in feedback check");
    console.error(e);
    return FeedbackCheckResult.ERROR;
  }
}
