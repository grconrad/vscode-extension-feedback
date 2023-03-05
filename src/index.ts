/**
 * Entry point
 *
 * This module imports "vscode" API surface so that other modules don't have to.
 *
 * It passes down the parts of "vscode" used by this library to other modules, representing them
 * to tsc using our own internal types.
 *
 * By limiting our dependency on "vscode" to the topmost level in the module dependency graph, we
 * allow other modules to be unit tested, with test logic supplying mock implementations of our
 * types to simulate what "vscode" APIs would provide.
 *
 * Let's see how deep this rabbit hole goes... ;-)
 */

import { env, window, Uri } from "vscode";

import type {
  IFeedbackContext,
  IFeedbackOpts,
  IDisposableLike,
  IOpenExternalFeedbackForm,
  IScheduleFeedbackChecksApi,
} from "./types";

// Expected API
import { scheduleFeedbackChecks as _scheduleFeedbackChecks } from "./scheduler";
export function scheduleFeedbackChecks(
  feedbackContext: IFeedbackContext,
  opts: IFeedbackOpts
): Promise<IDisposableLike> {
  const vscodeApi: IScheduleFeedbackChecksApi = {
    windowShowInformationMessage: window.showInformationMessage,
    openExternalFeedbackForm,
  };
  return _scheduleFeedbackChecks(vscodeApi, feedbackContext, opts);
}

/**
 * Implement this here because there's not much that could be unit tested anyway.
 *
 * @param feedbackFormUrl
 */
export const openExternalFeedbackForm: IOpenExternalFeedbackForm =
  async function (feedbackFormUrl: string): Promise<boolean> {
    const successful = await env.openExternal(Uri.parse(feedbackFormUrl));
    return successful;
  };

// To support upgrade scenarios or authors choosing to ignore prior feedback history
export { clearStorage } from "./state";
