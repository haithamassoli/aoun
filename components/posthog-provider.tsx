import { PostHogProvider as PostHogNextProvider } from "@posthog/next";
import { PostHogRouteTracker } from "@/components/posthog-page-view";

type PostHogProviderProps = {
  children: React.ReactNode;
};

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export async function PostHogProvider({ children }: PostHogProviderProps) {
  if (!posthogKey || !posthogHost) {
    return <>{children}</>;
  }

  return (
    <PostHogNextProvider
      apiKey={posthogKey}
      clientOptions={{
        api_host: posthogHost,
      }}
    >
      <PostHogRouteTracker />
      {children}
    </PostHogNextProvider>
  );
}
