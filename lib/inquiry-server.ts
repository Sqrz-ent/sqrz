import { randomUUID } from "node:crypto";

import { StreamChat } from "stream-chat";

import { supabaseServer } from "@/lib/supabase-server";

const STREAM_CHANNEL_TYPE = "messaging";

type InquiryThreadRow = {
  id: string;
  profile_id: string;
  status: "open" | "converted" | "closed";
  provider_channel_id: string;
  visitor_token: string;
  visitor_stream_user_id: string;
  owner_stream_user_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  converted_booking_id?: string | null;
};

type ProfileRow = {
  id: string;
  slug: string;
  plan_id: number | null;
  name: string | null;
  brand_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

function getStreamEnv() {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey) throw new Error("STREAM_API_KEY is not set");
  if (!apiSecret) throw new Error("STREAM_API_SECRET is not set");

  return { apiKey, apiSecret };
}

function getStreamServerClient() {
  const { apiKey, apiSecret } = getStreamEnv();
  return StreamChat.getInstance(apiKey, apiSecret);
}

function createStreamUserToken(userId: string) {
  const { apiSecret } = getStreamEnv();
  return StreamChat.getInstance(getStreamEnv().apiKey, apiSecret).createToken(userId);
}

function toStreamUserIdForProfile(profileId: string) {
  return `profile_${profileId}`;
}

function toStreamInquiryChannelId(threadId: string) {
  return `inquiry_${threadId}`;
}

function toStreamVisitorUserId(threadId: string) {
  return `inquiry_visitor_${threadId}`;
}

function formatProfileName(profile: ProfileRow) {
  return (
    profile.brand_name ||
    profile.name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.slug
  );
}

async function getInquiryProfile(profileId: string) {
  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("id, slug, plan_id, name, brand_name, first_name, last_name, email")
    .eq("id", profileId)
    .maybeSingle();

  return (profile as ProfileRow | null) ?? null;
}

async function queryStreamChannel(channelId: string) {
  const client = getStreamServerClient();
  const channels = await client.queryChannels(
    {
      type: STREAM_CHANNEL_TYPE,
      id: channelId,
    },
    [],
    {
      watch: false,
      state: true,
    }
  );

  return channels[0] ?? null;
}

async function ensureInquiryStreamResources(input: {
  thread: InquiryThreadRow;
  ownerName: string;
}) {
  const { thread, ownerName } = input;
  const client = getStreamServerClient();

  await client.upsertUsers([
    {
      id: thread.owner_stream_user_id,
      name: ownerName,
      role: "admin",
      sqrz_profile_id: thread.profile_id,
    } as any,
    {
      id: thread.visitor_stream_user_id,
      name: thread.visitor_name || "Visitor",
      role: "user",
    } as any,
  ]);

  const existingChannel = await queryStreamChannel(thread.provider_channel_id);
  if (!existingChannel) {
    const channel = client.channel(STREAM_CHANNEL_TYPE, thread.provider_channel_id, {
      created_by_id: thread.owner_stream_user_id,
      members: [thread.owner_stream_user_id, thread.visitor_stream_user_id],
      sqrz_inquiry_thread_id: thread.id,
      sqrz_profile_id: thread.profile_id,
      sqrz_thread_kind: "profile_inquiry",
    } as any);
    await channel.create();
    return;
  }

  const existingMembers = new Set(Object.keys(existingChannel.state.members ?? {}));
  const missingMembers = [thread.owner_stream_user_id, thread.visitor_stream_user_id]
    .filter((memberId) => !existingMembers.has(memberId));

  if (missingMembers.length > 0) {
    await existingChannel.addMembers(missingMembers);
  }
}

function buildInquirySession(input: {
  profile: ProfileRow;
  thread: InquiryThreadRow;
}) {
  const { profile, thread } = input;
  const { apiKey } = getStreamEnv();

  return {
    apiKey,
    thread: {
      id: thread.id,
      visitorName: thread.visitor_name,
      visitorEmail: thread.visitor_email,
      channelId: thread.provider_channel_id,
    },
    visitorToken: thread.visitor_token,
    streamUser: {
      id: thread.visitor_stream_user_id,
      name: thread.visitor_name || "Visitor",
    },
    token: createStreamUserToken(thread.visitor_stream_user_id),
    owner: {
      profileId: profile.id,
      displayName: formatProfileName(profile),
    },
  };
}

async function buildConvertedInquiryHandoff(input: {
  profile: ProfileRow;
  thread: InquiryThreadRow;
}) {
  const { profile, thread } = input;
  if (!thread.converted_booking_id) {
    return { thread: null };
  }

  const { data: buyerParticipant } = await supabaseServer
    .from("booking_participants")
    .select("invite_token")
    .eq("booking_id", thread.converted_booking_id)
    .eq("role", "buyer")
    .maybeSingle();

  const inviteToken = (buyerParticipant as { invite_token?: string | null } | null)?.invite_token ?? null;
  const dashboardBaseUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "https://dashboard.sqrz.com";
  const accessUrl = inviteToken
    ? `${dashboardBaseUrl}/booking/${thread.converted_booking_id}?token=${encodeURIComponent(inviteToken)}`
    : `${dashboardBaseUrl}/booking/${thread.converted_booking_id}`;

  return {
    status: "converted" as const,
    thread: {
      id: thread.id,
      visitorName: thread.visitor_name,
      visitorEmail: thread.visitor_email,
      channelId: thread.provider_channel_id,
    },
    handoff: {
      bookingId: thread.converted_booking_id,
      accessUrl,
      ctaLabel: "Review proposal",
      ownerDisplayName: formatProfileName(profile),
    },
  };
}

export async function bootstrapExistingInquirySession(input: {
  profileId: string;
  visitorToken: string;
}) {
  const { profileId, visitorToken } = input;
  const profile = await getInquiryProfile(profileId);
  const hasPremiumAccess = profile?.plan_id != null && Number(profile.plan_id) > 0;

  if (!profile || !hasPremiumAccess) {
    return null;
  }

  const { data: thread } = await supabaseServer
    .from("profile_inquiry_threads")
    .select("*")
    .eq("profile_id", profileId)
    .eq("visitor_token", visitorToken)
    .in("status", ["open", "converted"])
    .order("updated_at", { ascending: false })
    .maybeSingle();

  if (!thread) {
    return null;
  }

  const inquiryThread = thread as InquiryThreadRow;

  if (inquiryThread.status === "converted") {
    return buildConvertedInquiryHandoff({
      profile,
      thread: inquiryThread,
    });
  }

  await ensureInquiryStreamResources({
    thread: inquiryThread,
    ownerName: formatProfileName(profile),
  });

  return buildInquirySession({
    profile,
    thread: inquiryThread,
  });
}

export async function startInquirySession(input: {
  profileId: string;
  visitorToken?: string | null;
  visitorName?: string | null;
  visitorEmail?: string | null;
}) {
  const { profileId, visitorToken, visitorName, visitorEmail } = input;
  const profile = await getInquiryProfile(profileId);

  if (!profile) {
    throw new Error("Profile not found");
  }

  if (profile.plan_id == null || Number(profile.plan_id) <= 0) {
    throw new Error("Inquiry messaging is not enabled for this profile");
  }

  if (visitorToken) {
    const existing = await bootstrapExistingInquirySession({
      profileId,
      visitorToken,
    });

    if (existing?.thread?.id) {
      if (
        (visitorName && visitorName !== existing.thread.visitorName) ||
        (visitorEmail && visitorEmail !== existing.thread.visitorEmail)
      ) {
        await supabaseServer
          .from("profile_inquiry_threads")
          .update({
            visitor_name: visitorName ?? existing.thread.visitorName,
            visitor_email: visitorEmail ?? existing.thread.visitorEmail,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.thread.id);
      }

      return existing;
    }
  }

  const threadId = randomUUID();
  const nextVisitorToken = visitorToken ?? randomUUID();
  const ownerStreamUserId = toStreamUserIdForProfile(profile.id);
  const newThread = {
    id: threadId,
    profile_id: profile.id,
    status: "open" as const,
    provider: "stream",
    provider_channel_id: toStreamInquiryChannelId(threadId),
    visitor_token: nextVisitorToken,
    visitor_stream_user_id: toStreamVisitorUserId(threadId),
    owner_stream_user_id: ownerStreamUserId,
    visitor_name: visitorName ?? null,
    visitor_email: visitorEmail ?? null,
  };

  const { error } = await supabaseServer
    .from("profile_inquiry_threads")
    .insert(newThread);

  if (error) {
    throw error;
  }

  await ensureInquiryStreamResources({
    thread: newThread,
    ownerName: formatProfileName(profile),
  });

  return buildInquirySession({
    profile,
    thread: newThread,
  });
}
