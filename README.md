# @grconrad/vscode-extension-feedback

![](https://github.com/grconrad/vscode-extension-feedback/workflows/Node.js%20CI/badge.svg)

Gather feedback from users of your VS Code extension, using an external form hosted on the web.

Make a single API call from your extension's `activate` entry point.

Control the timing and text of the feedback prompts.

## Usage

Create a publicly accessible survey form (Google form, Surveymonkey, etc.)

From your `activate` entry point, invoke `scheduleFeedbackChecks`. The result is a Disposable you
can add to your extension context subscriptions to ensure the scheduled checks get cancelled when
your extension deactivates.

Example where the feedback survey is specified in an extension's package.json `feedbackFormUrl`
field:

```js
import { window, Disposable, ExtensionContext, OutputChannel } from "vscode";

import { scheduleFeedbackChecks } from "@grconrad/vscode-extension-feedback";

const { feedbackFormUrl } = require("../package.json");

export async function activate(context: ExtensionContext): Promise<void> {
  // ...
  const channel = window.createOutputChannel("My Extension");
  // ...
  scheduleFeedbackChecks(
    {
      memento: context.globalState,
      logFn: (text: string) => {
        outputChannel.appendLine(text);
      }
    },
    {
      feedbackFormUrl,
      // Use default timings
      // Use default text
    }
  ).then((disposable: Disposable) => {
    context.subscriptions.push(disposable);
  }).catch((reason: any) => {
    channel.appendLine(`Failed to schedule feedback checks: reason=${reason}`);
  });
  // ...
```

## Notes

**Timings** to control the feedback checking are also customizable. By default:

- Checking occurs once per day
- The _first_ prompt occurs 7 days after the extension first begins its scheduled feedback checking
- Reminders occur 7 days after the last prompt

The time of the last prompt, and information about whether the user has provided feedback or said
"Don't ask again", are persisted to disk using context.globalState so that they can survive reboots
of VS Code.

**Text** in the prompts is also customizable. By default:

- The prompt is "Enjoying this extension? We'd love your feedback!"
- Choices (buttons) from left to right are: "Give feedback", "Not now" and "Don't ask again"

## Customizations

The second parameter to `scheduleFeedbackChecks` is an object where you can specify timings, if
you're unhappy with the defaults.

Example of overriding the defaults:

```js
  scheduleFeedbackChecks(
    {
      memento: context.globalState,
      logFn: (text: string) => {
        outputChannel.appendLine(text);
      }
    },
    {
      feedbackFormUrl,
      // All times are in milliseconds
      timings: {
        checkInterval: 15 * 1000,    // 15 seconds
        firstAskInterval: 60 * 1000, // 1 minute
        reminderInterval: 30 * 1000, // 30 seconds
      },
      localizedText: {
        promptText: "Liking this extension?",
        giveFeedbackText: "Tell us",
        notNowText: "Later",
        dontAskAgainText: "Stop asking"
      }
    }
  ).then((disposable: Disposable) => {
    context.subscriptions.push(disposable);
  }).catch((reason: any) => {
    channel.appendLine(`Failed to schedule feedback checks: reason=${reason}`);
  });
  // ...
```
