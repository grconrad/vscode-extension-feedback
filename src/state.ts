/**
 * State management
 *
 * All state is held in memory. Some state is also persisted to disk.
 *
 * [initState](#initState) must be used to initialize all state. It reads persisted values from disk
 * into memory. Thereafter, memory is the source of truth; all writes go to memory first, then disk
 * if applicable.
 *
 * Getters (getXyz) are provided to read specific fields. They read from memory.
 *
 * Updaters (updateXyz) are provided to update specific fields. They always update values in memory
 * and also write to disk for fields persisted on disk.
 */

import { Memento } from "vscode";

// Unified model

// These fields are held only in memory (not persisted)
interface IInMemoryState {
  memento: Memento;
  feedbackCheckTimeoutId: NodeJS.Timeout | null;
}

/**
 * These fields are persisted to disk using a Memento
 */
interface IPersistedState {
  firstCheckedTime: number | undefined;
  lastAskedTime: number | undefined;
  lastFeedbackTime: number | undefined;
  dontAskAgain: boolean;
}

export interface IState extends IInMemoryState, IPersistedState {
}

let state: IState | null = null;

/**
 * Must be invoked before any attempts to read or modify state are made.
 * Will have no effect if state is already initialized.
 *
 * @internal
 */
export function initState(memento: Memento): void {
  if (state === null) {
    state = {
      memento,
      feedbackCheckTimeoutId: null,
      ...initPersistedState(memento)
    };
    // console.log('initState: state=', state);
  }
}

/**
 * Update a value in memory, and optionally persist it as well.
 */
function update(fieldName: keyof IState, value: any, storageKey?: StorageKey): void {
  updateInMemory({[fieldName]: value});
  if (storageKey) {
    state!.memento.update(storageKey, value);
  }
}

/**
 * Update a value in memory
 * ALL updates to state should call this function.
 */
function updateInMemory(newState: Partial<IState>): void {
  state = {
    ...state!,
    ...newState
  };
}

// --------------------
// State held in memory
// --------------------

export function getFeedbackCheckTimeoutId(): NodeJS.Timeout | null {
  return state!.feedbackCheckTimeoutId;
}

export function setFeedbackCheckTimeoutId(timeoutId: NodeJS.Timeout | null): void {
  update("feedbackCheckTimeoutId", timeoutId);
}

/**
 * State persisted to disk (survives deactivation of extension, e.g. window reload or app shutdown)
 */

export enum StorageKey {
  SK_FIRST_CHECKED = "feedback.firstCheckedTime",
  SK_LAST_ASKED = "feedback.lastAskedTime",
  SK_LAST_FEEDBACK = "feedback.lastFeedbackTime",
  SK_DONT_ASK = "feedback.dontAskAgain",
}

function initPersistedState(memento: Memento): IPersistedState {
  return {
    firstCheckedTime: memento.get(StorageKey.SK_FIRST_CHECKED),
    lastAskedTime: memento.get(StorageKey.SK_LAST_ASKED),
    lastFeedbackTime: memento.get(StorageKey.SK_LAST_FEEDBACK),
    dontAskAgain: memento.get(StorageKey.SK_DONT_ASK, false),
  };
}

export function getFirstCheckedTime(): number | undefined {
  return state!.firstCheckedTime;
}

export function updateFirstCheckedTime(timestamp: number): void {
  update("firstCheckedTime", timestamp, StorageKey.SK_FIRST_CHECKED);
}

export function getLastAskedTime(): number | undefined {
  return state!.lastAskedTime;
}

export function updateLastAskedTime(timestamp: number): void {
  update("lastAskedTime", timestamp, StorageKey.SK_LAST_ASKED);
}

export function getLastFeedbackTime(): number | undefined {
  return state!.lastFeedbackTime;
}

export function updateLastFeedbackTime(timestamp: number): void {
  update("lastFeedbackTime", timestamp, StorageKey.SK_LAST_FEEDBACK);
}

export function getDontAsk(): boolean {
  return state!.dontAskAgain;
}

export function updateDontAsk(b: boolean): void {
  update("dontAskAgain", b, StorageKey.SK_DONT_ASK);
}

/**
 * Clear persisted state.
 *
 * This should not be used in normal circumstances because it erases the history of prior feedback
 * checks, which can lead to prompting users who have already given feedback or asked not to be
 * prompted.
 *
 * One case where it might be useful: You've published a new major version of your extension with
 * The Greatest Feature Ever, and you want to ask everyone for feedback even if they previously
 * responded to lesser releases. But, do so at your own risk.
 */
export function clearStorage(memento: Memento): void {
  // Write to disk
  Object.values(StorageKey).forEach(key => {
    memento.update(key, undefined);
  });
  if (state?.memento === memento) {
    // Same memento was previously used to initialize state
    // Overwrite what's in memory
    state = {
      ...state,
      ...initPersistedState(memento)
    };
  }
}

/**
 * @internal to support testing
 */
export function clearState(): void {
  if (!state) {
    return;
  }
  if (state.memento) {
    clearStorage(state.memento);
  }
  if (state.feedbackCheckTimeoutId) {
    clearTimeout(state.feedbackCheckTimeoutId);
  }
  state = null;
}
