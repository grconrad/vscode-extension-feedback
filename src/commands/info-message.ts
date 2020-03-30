import { window } from "vscode";

const POSSIBLE_RATINGS = [
  "😧 Ugh",
  "😐 Meh",
  "😀 Cool"
];

/**
 * @internal
 */
export async function gatherFeedbackInfoMessage(): Promise<void> {
  const rating = await window.showInformationMessage("Please rate this extension",
    ...POSSIBLE_RATINGS
  );
  if (!rating) {
    return;
  }
  window.showInformationMessage(`Received your rating "${rating}". Thank you!`);
}
