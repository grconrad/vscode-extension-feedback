import { env, Uri } from "vscode";

/**
 * @param feedbackFormUrl URL of external feedback form (Google form, Surveymonkey, etc.)
 * @returns Whether VS Code was able to open the external feedback form successfully
 */
export async function openExternalFeedbackForm(feedbackFormUrl: string): Promise<boolean> {
  const successful = await env.openExternal(Uri.parse(feedbackFormUrl));
  return successful;
}
