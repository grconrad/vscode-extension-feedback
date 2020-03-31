/**
 * Entry point
 *
 * This module imports "vscode" API surface so that other modules don't have to.
 *
 * This keeps our dependency on "vscode" to the topmost level in the module dependency graph. It
 * allows other modules to be unit tested, with test logic supplying mock implementations.
 */

import { Memento } from "vscode";

import { ALL_KEYS as storageKeys } from "./storage";

export { scheduleFeedbackChecks } from "./scheduler";

/**
 * Clear persisted state.
 *
 * This should not be called under most circumstances, but could come in handy in rare situations
 * e.g. when an extension's author publishes a major version upgrade and wants to wipe the slate
 * clean and prompt again for feedback following installation.
 */
export function clearStorage(memento: Memento): void {
  storageKeys.forEach(key => {
    memento.update(key, undefined);
  });
}
