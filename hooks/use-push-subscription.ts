"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  subscribeToPush,
  getExistingSubscription,
  unsubscribeFromPush,
} from "@/lib/push-subscription";

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const subscriptionDoc = useQuery(
    api.pushSubscriptions.getByEndpoint,
    endpoint ? { endpoint } : "skip"
  );

  const subscribeMutation = useMutation(api.pushSubscriptions.subscribe);
  const unsubscribeMutation = useMutation(api.pushSubscriptions.unsubscribe);

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (supported) {
      getExistingSubscription().then((sub) => {
        if (sub) setEndpoint(sub.endpoint);
      });
    }
  }, []);

  const subscribe = useCallback(
    async (majorId: Id<"majors">) => {
      setIsLoading(true);
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          return false;
        }

        let sub = await getExistingSubscription();
        if (!sub) {
          sub = await subscribeToPush();
        }

        const key = sub.getKey("p256dh");
        const auth = sub.getKey("auth");
        if (!key || !auth) return false;

        const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)));
        const authStr = btoa(String.fromCharCode(...new Uint8Array(auth)));

        await subscribeMutation({
          endpoint: sub.endpoint,
          p256dh,
          auth: authStr,
          majorId,
        });

        setEndpoint(sub.endpoint);
        return true;
      } finally {
        setIsLoading(false);
      }
    },
    [subscribeMutation]
  );

  const unsubscribe = useCallback(
    async (majorId: Id<"majors">) => {
      setIsLoading(true);
      try {
        const sub = await getExistingSubscription();
        if (!sub) return;

        await unsubscribeMutation({
          endpoint: sub.endpoint,
          majorId,
        });

        // If this was the last major, unsubscribe from push entirely
        if (
          subscriptionDoc &&
          subscriptionDoc.majorIds.length <= 1
        ) {
          await unsubscribeFromPush();
          setEndpoint(null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [unsubscribeMutation, subscriptionDoc]
  );

  const isSubscribedToMajor = useCallback(
    (majorId: Id<"majors">) => {
      if (!subscriptionDoc) return false;
      return subscriptionDoc.majorIds.includes(majorId);
    },
    [subscriptionDoc]
  );

  return {
    isSupported,
    isLoading,
    endpoint,
    subscribe,
    unsubscribe,
    isSubscribedToMajor,
  };
}
