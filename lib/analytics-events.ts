type PostHogBrowserClient = {
  capture: (eventName: string, properties?: Record<string, unknown>) => void;
};

type AnalyticsWindow = Window &
  typeof globalThis & {
    posthog?: PostHogBrowserClient;
  };

export function captureAnalyticsEvent(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  if (typeof window === "undefined") {
    return;
  }

  (window as AnalyticsWindow).posthog?.capture(eventName, properties);
}
