import { checkNow } from "../src/checker";
import { ITimings, FeedbackCheckResult, IFeedbackOpts } from "../src/types";
import { defaultText } from "../src/l10n";
import { initState, clearState } from "../src/state";

const SHORT_TIMINGS: ITimings = {
  checkInterval: 0.5 * 1000, // 0.5s
  firstAskInterval: 1 * 1000, // 1s
  reminderInterval: 3 * 1000, // 2s
};

// Test mocks the logic that would otherwise try to navigate to the external feedback form
const TEST_FEEDBACK_FORM_URL = "http://www.google.com";

const testOpts: IFeedbackOpts = {
  feedbackFormUrl: TEST_FEEDBACK_FORM_URL,
  timings: SHORT_TIMINGS,
  localizedText: defaultText
};

// Mock storage service by implementing Memento interface, similar to how class ExtensionMemento
// does it in vscode source:
// [extHostMemento.ts](https://github.com/microsoft/vscode/blob/master/src/vs/workbench/api/common/extHostMemento.ts)

// Simulating new install of extension where no data exists because feedback checking has never run
class MockMemento {
  constructor(private obj: {[key: string]: any} = {}) {}
	get<T>(key: string): T | undefined;
	get<T>(key: string, defaultValue: T): T;
	get<T>(key: string, _defaultValue?: T): T {
    return this.obj[key];
  }
  async update(key: string, value: any): Promise<void> {
    this.obj[key] = value;
    return;
  }
}

// Prior state: None (simulates first-time activation of extension)
// Expected result of check: too soon
class DueForFirstCheckMemento extends MockMemento {
  // No need for any override here
  // Base class will initialize empty data
}

// Prior state: We've checked before, but haven't asked, and it's time to ask
// Expected result of check: we ask
class DueForFirstAskMemento extends MockMemento {
  constructor() {
    const now = Date.now();
    super({
      "feedback.firstCheckedTime": now - SHORT_TIMINGS.firstAskInterval,
      // feedback.lastAskedTime
      // feedback.lastFeedbackTime
      // feedback.dontAskAgain
    });
  }
}

// Prior state: We've asked before, but haven't received feedback, and it's too soon for a reminder
// Expected result of check: too soon
class TooSoonForReminderMemento extends MockMemento {
  constructor() {
    const now = Date.now();
    super({
      "feedback.firstCheckedTime": now - 24 * 60 * 60 * 1000, // 1 day ago
      "feedback.lastAskedTime": now - SHORT_TIMINGS.reminderInterval / 2,
      // feedback.lastFeedbackTime
      // feedback.dontAskAgain
    });
  }
}

// Prior state: We've asked before, but haven't received feedback, and it's time for a reminder
// Expected result of check: we ask
class DueForReminderMemento extends MockMemento {
  constructor() {
    const now = Date.now();
    super({
      "feedback.firstCheckedTime": now - 24 * 60 * 60 * 1000, // 1 day ago
      "feedback.lastAskedTime": now - SHORT_TIMINGS.reminderInterval,
      // feedback.lastFeedbackTime
      // feedback.dontAskAgain
    });
  }
}

// Prior state: We've asked before, and we've already received feedback
// Expected result of check: we don't do anything
class FeedbackAlreadyGivenMemento extends MockMemento {
  constructor() {
    const now = Date.now();
    super({
      "feedback.firstCheckedTime": now - 24 * 60 * 60 * 1000, // 1 day ago
      "feedback.lastAskedTime": now - SHORT_TIMINGS.reminderInterval,
      "feedback.lastFeedbackTime": now - 50,
      // feedback.dontAskAgain
    });
  }
}

// Prior state: We've asked before, but user has said "Don't ask again"
// Expected result of check: ???
class AnnoyedUserMemento extends MockMemento {
  constructor() {
    const now = Date.now();
    super({
      "feedback.firstCheckedTime": now - 24 * 60 * 60 * 1000, // 1 day ago
      "feedback.lastAskedTime": now - SHORT_TIMINGS.reminderInterval,
      // No "feedback.lastFeedbackTime"
      "feedback.dontAskAgain": true
    });
  }
}

async function mockAskWithDismissal(_message: string, ..._items: string[]): Promise<string | undefined> {
  // As if user just closed the info message without clicking any button
  return undefined;
}

async function mockAskWithFeedback(_message: string, ..._items: string[]): Promise<string | undefined> {
  // As if user clicked "Give feedback" to open the external survey form
  return defaultText.giveFeedbackText;
}

async function mockAskWithNotNow(_message: string, ..._items: string[]): Promise<string | undefined> {
  // As if user clicked "Not now"
  return defaultText.notNowText;
}

async function mockAskWithDontAskAgain(_message: string, ..._items: string[]): Promise<string | undefined> {
  // As if user clicked "Don't ask again"
  return defaultText.dontAskAgainText;
}

test("No previous feedback checks, should skip it", async () => {
  clearState();
  const memento = new DueForFirstCheckMemento();
  initState(memento);
  const mockPrompt = jest.fn(mockAskWithDismissal);
  const result = await checkNow(
    {
      openExternalFeedbackForm: async () => true,
      windowShowInformationMessage: mockPrompt,
    },
    {
      logFn: console.log,
      memento,
    },
    testOpts
  );
  expect(result).toEqual(FeedbackCheckResult.TOO_SOON);
  expect(mockPrompt).toHaveBeenCalledTimes(0);
});

test("Time for first ask, user ignores it", async () => {
  clearState();
  const memento = new DueForFirstAskMemento();
  initState(memento);
  const mockPrompt = jest.fn(mockAskWithDismissal);
  const result = await checkNow(
    {
      openExternalFeedbackForm: async () => true,
      windowShowInformationMessage: mockPrompt,
    },
    {
      logFn: console.log,
      memento,
    },
    testOpts
  );
  expect(result).toEqual(FeedbackCheckResult.NO_RESPONSE);
  expect(mockPrompt).toHaveBeenCalledTimes(1);
});

test("Too soon for reminder, should skip it", async () => {
  clearState();
  const memento = new TooSoonForReminderMemento();
  initState(memento);
  const mockPrompt = jest.fn(mockAskWithDismissal);
  const result = await checkNow(
    {
      openExternalFeedbackForm: async () => true,
      windowShowInformationMessage: mockPrompt, // not used in this scenario
    },
    {
      logFn: console.log,
      memento,
    },
    testOpts
  );
  expect(result).toEqual(FeedbackCheckResult.TOO_SOON);
  expect(mockPrompt).toHaveBeenCalledTimes(0);
});

test("Time for reminder, user ignores it", async () => {
  clearState();
  const memento = new DueForReminderMemento();
  initState(memento);
  const mockPrompt = jest.fn(mockAskWithNotNow);
  const result = await checkNow(
    {
      openExternalFeedbackForm: async () => true,
      windowShowInformationMessage: mockPrompt,
    },
    {
      logFn: console.log,
      memento,
    },
    testOpts
  );
  expect(result).toEqual(FeedbackCheckResult.NO_RESPONSE);
  expect(mockPrompt).toHaveBeenCalledTimes(1);
});

test("Time for reminder, user gives feedback", async () => {
  clearState();
  const memento = new DueForReminderMemento();
  initState(memento);
  const mockPrompt = jest.fn(mockAskWithFeedback);
  const result = await checkNow(
    {
      openExternalFeedbackForm: async () => true,
      windowShowInformationMessage: mockPrompt, // not used in this scenario
    },
    {
      logFn: console.log,
      memento,
    },
    testOpts
  );
  expect(result).toEqual(FeedbackCheckResult.RESPONSE_FEEDBACK);
  expect(mockPrompt).toHaveBeenCalledTimes(1);
});

test("Time for reminder, user asks not to be asked again", async () => {
  clearState();
  const memento = new DueForReminderMemento();
  initState(memento);
  const mockPrompt = jest.fn(mockAskWithDontAskAgain);
  const result = await checkNow(
    {
      openExternalFeedbackForm: async () => true,
      windowShowInformationMessage: mockPrompt, // not used in this scenario
    },
    {
      logFn: console.log,
      memento,
    },
    testOpts
  );
  expect(result).toEqual(FeedbackCheckResult.RESPONSE_DONT_ASK);
  expect(mockPrompt).toHaveBeenCalledTimes(1);
});

test("User has already given feedback", async () => {
  clearState();
  const memento = new FeedbackAlreadyGivenMemento();
  initState(memento);
  const mockPrompt = jest.fn(mockAskWithDismissal);
  const result = await checkNow(
    {
      openExternalFeedbackForm: async () => true,
      windowShowInformationMessage: mockPrompt, // not used in this scenario
    },
    {
      logFn: console.log,
      memento,
    },
    testOpts
  );
  expect(result).toEqual(FeedbackCheckResult.ALREADY_RESPONDED);
  expect(mockPrompt).toHaveBeenCalledTimes(0);
});

test("User has said not to ask again", async () => {
  clearState();
  const memento = new AnnoyedUserMemento();
  initState(memento);
  const mockPrompt = jest.fn(mockAskWithDismissal);
  const result = await checkNow(
    {
      openExternalFeedbackForm: async () => true,
      windowShowInformationMessage: mockPrompt, // not used in this scenario
    },
    {
      logFn: console.log,
      memento,
    },
    testOpts
  );
  expect(result).toEqual(FeedbackCheckResult.WONT_ASK);
  expect(mockPrompt).toHaveBeenCalledTimes(0);
});
