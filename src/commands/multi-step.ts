import { window, env } from "vscode";

const POSSIBLE_RATINGS = [
  "😧 Ugh",
  "$(thumbsdown)",
  "😐 Meh",
  "$(thumbsup)",
  "😀 Yay",
];

/**
 * @internal
 */
export async function gatherFeedbackQuickInputs(): Promise<void> {
  const rating = await window.showQuickPick(POSSIBLE_RATINGS, {
    placeHolder: "Please rate this extension",
  });
  if (!rating) {
    return;
  }
  const feedbackText = await window.showInputBox({
    placeHolder: "It's the coolest thing since sliced bread!",
    prompt: "Anything else to share or suggest?",
  });
  const sessionContextStr = JSON.stringify({
    machineId: env.machineId,
    sessionId: env.sessionId
  });
  if (feedbackText && feedbackText.trim() !== "") {
    window.showInformationMessage(`
      Received your rating "${rating}" and feedback "${feedbackText}".
      Thank you!
      Session context = ${sessionContextStr}
    `);
  } else {
    window.showInformationMessage(`
      Received your rating "${rating}".
      Thank you!
      Session context = ${sessionContextStr}
    `);
  }
}

// For a more robust multi-step wizard-like feedback mechanism, consider this:
// https://github.com/microsoft/vscode-extension-samples/blob/master/quickinput-sample/src/multiStepInput.ts?ts=2
