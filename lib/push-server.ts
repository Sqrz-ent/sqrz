import webpush from "web-push";

import { supabaseServer } from "@/lib/supabase-server";

type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

type InquiryThreadNotificationRow = {
  id: string;
  profile_id: string;
  visitor_name: string | null;
};

type ProfileNotificationRow = {
  brand_name: string | null;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  slug: string | null;
};

function getPushEnv() {
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@sqrz.com";

  return { publicKey, privateKey, subject };
}

export function isPushConfigured() {
  const { publicKey, privateKey, subject } = getPushEnv();
  return !!publicKey && !!privateKey && !!subject;
}

function getWebPushClient() {
  const { publicKey, privateKey, subject } = getPushEnv();
  if (!publicKey || !privateKey) {
    throw new Error("Web Push is not configured");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

function formatProfileName(profile: ProfileNotificationRow | null) {
  if (!profile) return "SQRZ";
  return (
    profile.brand_name ||
    profile.name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.slug ||
    "SQRZ"
  );
}

function trimBody(text: string) {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= 140) return collapsed;
  return `${collapsed.slice(0, 137)}...`;
}

async function deactivatePushSubscription(endpoint: string) {
  await supabaseServer
    .from("push_subscriptions")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("endpoint", endpoint);
}

async function loadActiveSubscriptions(profileId: string) {
  const { data, error } = await supabaseServer
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("profile_id", profileId)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as StoredSubscription[];
}

export async function sendInquiryPushNotification(input: {
  threadId: string;
  messageText: string;
}) {
  const { data: thread, error: threadError } = await supabaseServer
    .from("profile_inquiry_threads")
    .select("id, profile_id, visitor_name")
    .eq("id", input.threadId)
    .eq("status", "open")
    .maybeSingle();

  if (threadError) {
    throw new Error(threadError.message);
  }

  const inquiryThread = thread as InquiryThreadNotificationRow | null;
  if (!inquiryThread) {
    return { sent: 0, skipped: true };
  }

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("brand_name, name, first_name, last_name, slug")
    .eq("id", inquiryThread.profile_id)
    .maybeSingle();

  const ownerName = formatProfileName((profile as ProfileNotificationRow | null) ?? null);
  const title = inquiryThread.visitor_name
    ? `${inquiryThread.visitor_name} sent a new inquiry`
    : "New inquiry message";
  const body = trimBody(input.messageText);
  const targetUrl = "/service";
  const now = new Date().toISOString();

  const { data: inserted, error: insertError } = await supabaseServer
    .from("notification_events")
    .insert({
      profile_id: inquiryThread.profile_id,
      actor_profile_id: null,
      recipient_profile_id: inquiryThread.profile_id,
      type: "inquiry_message",
      source_id: inquiryThread.id,
      title,
      body,
      target_url: targetUrl,
      status: "pending",
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    throw new Error(insertError?.message ?? "Failed to create notification event");
  }

  if (!isPushConfigured()) {
    await supabaseServer
      .from("notification_events")
      .update({
        status: "failed",
        last_error: "Web Push is not configured",
        delivery_attempts: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inserted.id);
    return { sent: 0, skipped: true };
  }

  const subscriptions = await loadActiveSubscriptions(inquiryThread.profile_id);
  if (!subscriptions.length) {
    await supabaseServer
      .from("notification_events")
      .update({
        status: "failed",
        last_error: "No active subscriptions",
        delivery_attempts: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inserted.id);
    return { sent: 0, skipped: true };
  }

  const payload = JSON.stringify({
    title,
    body,
    targetUrl,
    tag: `inquiry_message:${inquiryThread.id}`,
    ownerName,
  });

  const client = getWebPushClient();
  let sent = 0;
  let attempts = 0;
  let lastError: string | null = null;

  for (const subscription of subscriptions) {
    attempts += 1;
    try {
      await client.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload
      );
      sent += 1;
    } catch (error) {
      const statusCode =
        typeof error === "object" && error && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : null;
      const message = error instanceof Error ? error.message : "Failed to send push";
      lastError = message;

      if (statusCode === 404 || statusCode === 410) {
        await deactivatePushSubscription(subscription.endpoint);
      }
    }
  }

  await supabaseServer
    .from("notification_events")
    .update({
      status: sent > 0 ? "sent" : "failed",
      delivery_attempts: attempts,
      last_error: sent > 0 ? null : lastError,
      sent_at: sent > 0 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inserted.id);

  return { sent, skipped: false };
}
