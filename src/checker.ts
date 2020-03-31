/**
 * The brain of the feedback checking mechanism
 */

import { IFeedbackContext, FeedbackCheckResult, IFeedbackOpts } from "./types";
import { setFeedbackCheckTimeoutId } from "./state";
import { KEY_LAST_FEEDBACK, KEY_DONT_ASK, KEY_FIRST_CHECKED, KEY_LAST_ASKED } from "./storage";
import { askForFeedback } from "./prompt";

/**
 * Check whether anything needs to be done for feedback gathering. If it's appropriate to ask for
 * feedback, do that now. Then schedule the next feedback check, if appropriate.
 *
 * If the user closes the prompt or clicks "Not now", schedule the next check and stash the timeout
 * id.
 */
export async function checkForFeedback(
  feedbackContext: IFeedbackContext,
  opts: IFeedbackOpts,
): Promise<void> {

  const logFn = feedbackContext.logFn;

  const result: FeedbackCheckResult = await checkNow(feedbackContext, opts);
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
    checkForFeedback(feedbackContext, opts);
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
async function checkNow(
  feedbackContext: IFeedbackContext,
  opts: IFeedbackOpts
): Promise<FeedbackCheckResult> {

  const {memento, logFn} = feedbackContext;

  try {

    // Read persisted state.

    // If user has already provided feedback, don't ask anymore.
    if (memento.get<number>(KEY_LAST_FEEDBACK) !== undefined) {
      logFn("Skipping feedback prompt (feedback already provided)");
      return FeedbackCheckResult.ALREADY_RESPONDED;
    }

    // If user has said "don't ask again", respect that.
    if (memento.get<boolean>(KEY_DONT_ASK, false)) {
      logFn("Skipping feedback prompt (user doesn't want to be asked again)");
      return FeedbackCheckResult.WONT_ASK;
    }

    const now = Date.now();

    // Have we ever run the feedback check?
    const firstCheckedTime = memento.get<number>(KEY_FIRST_CHECKED);

    // If we've never asked, don't ask now. This is the first time the feedback check is running,
    // and probably the first time the extension is running. The user hasn't had enough time to use
    // it and form an opinion.
    if (firstCheckedTime === undefined) {
      memento.update(KEY_FIRST_CHECKED, now);
      logFn("Skipping feedback prompt (too soon for first ask)");
      return FeedbackCheckResult.TOO_SOON;
    }

    // We've run a check before, but might or might not have actually asked for feedback.

    const lastAskedTime = memento.get<number>(KEY_LAST_ASKED);
    const { firstAskInterval, reminderInterval } = opts.timings!;

    if (lastAskedTime === undefined && ((now - firstCheckedTime) < firstAskInterval!)) {
      // We've never asked for feedback, but it's too soon for the first ask.
      logFn("Skipping feedback prompt (too soon for first ask)");
      return FeedbackCheckResult.TOO_SOON;
    }

    if (lastAskedTime !== undefined && ((now - lastAskedTime) < reminderInterval!)) {
      // We've asked for feedback before, but it's too soon for a reminder.
      logFn("Skipping feedback prompt (too soon for reminder)");
      return FeedbackCheckResult.TOO_SOON;
    }

    // Either we've never asked for feedback, or it was awhile ago.
    // Ask now.
    const result = await askForFeedback(feedbackContext, opts);
    memento.update(KEY_LAST_ASKED, now);
    if (result === FeedbackCheckResult.RESPONSE_DONT_ASK) {
      memento.update(KEY_DONT_ASK, true);
    } else if (result === FeedbackCheckResult.RESPONSE_FEEDBACK) {
      memento.update(KEY_LAST_FEEDBACK, Date.now());
    }
    return result;
  }
  catch (e) {
    logFn("Error in feedback check");
    console.error(e);
    return FeedbackCheckResult.ERROR;
  }
}
