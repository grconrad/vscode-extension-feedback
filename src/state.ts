let feedbackCheckTimeoutId: NodeJS.Timeout | null = null;

export function getFeedbackCheckTimeoutId(): NodeJS.Timeout | null {
  return feedbackCheckTimeoutId;
}

export function setFeedbackCheckTimeoutId(timeoutId: NodeJS.Timeout | null): void {
  feedbackCheckTimeoutId = timeoutId;
}
