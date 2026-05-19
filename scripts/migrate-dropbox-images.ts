/**
 * Migrate Dropbox image URLs → Supabase Storage
 *
 * Tables:  profile_photos.url
 *          profiles.avatar_url
 *          private_booking_links.cover_image_url
 *
 * Usage:
 *   npx tsx scripts/migrate-dropbox-images.ts          # dry run
 *   npx tsx scripts/migrate-dropbox-images.ts --run    # live
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { randomUUID } from "crypto";

// ── Load .env.local ──────────────────────────────────────────────────────────

try {
  const envContent = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on env already set
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const DRY_RUN = !process.argv.includes("--run");

// ── Helpers ──────────────────────────────────────────────────────────────────

function extFromUrl(url: string): string {
  const path = url.split("?")[0];
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? (ext === "jpeg" ? "jpg" : ext) : "jpg";
}

function contentTypeFromExt(ext: string): string {
  return ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/jpeg";
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToStorage(bucket: string, path: string, data: Buffer, contentType: string): Promise<string> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, data, { contentType, upsert: false });
  if (error) throw new Error(`Storage upload failed (${bucket}/${path}): ${error.message}`);
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicUrl;
}

// ── Migrate profile_photos ───────────────────────────────────────────────────

async function migrateProfilePhotos(): Promise<number> {
  const { data: photos, error } = await supabase
    .from("profile_photos")
    .select("id, profile_id, url, sort_order")
    .ilike("url", "%dropbox%");

  if (error) throw error;

  const count = photos?.length ?? 0;
  console.log(`\nprofile_photos: ${count} Dropbox URL${count !== 1 ? "s" : ""} found`);

  for (const photo of photos ?? []) {
    const ext = extFromUrl(photo.url);
    const ct = contentTypeFromExt(ext);
    const storagePath = `${photo.profile_id}/gallery/${randomUUID()}.${ext}`;

    console.log(`  photo ${photo.id} (sort_order=${photo.sort_order})`);
    console.log(`    src: ${photo.url.slice(0, 90)}${photo.url.length > 90 ? "…" : ""}`);
    console.log(`    dst: profile-media/${storagePath}`);

    if (!DRY_RUN) {
      const buffer = await downloadImage(photo.url);
      const publicUrl = await uploadToStorage("profile-media", storagePath, buffer, ct);
      const { error: dbError } = await supabase
        .from("profile_photos")
        .update({ url: publicUrl })
        .eq("id", photo.id);
      if (dbError) throw new Error(`DB update failed for photo ${photo.id}: ${dbError.message}`);
      console.log(`    ✓ → ${publicUrl}`);
    }
  }

  return count;
}

// ── Migrate profiles.avatar_url ──────────────────────────────────────────────

async function migrateAvatars(): Promise<number> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, user_id, slug, avatar_url")
    .ilike("avatar_url", "%dropbox%");

  if (error) throw error;

  const count = profiles?.length ?? 0;
  console.log(`\nprofiles.avatar_url: ${count} Dropbox URL${count !== 1 ? "s" : ""} found`);

  for (const profile of profiles ?? []) {
    const ext = extFromUrl(profile.avatar_url as string);
    const ct = contentTypeFromExt(ext);
    const storagePath = `${profile.user_id}/avatar-${randomUUID()}.${ext}`;

    console.log(`  profile ${profile.slug}`);
    console.log(`    src: ${(profile.avatar_url as string).slice(0, 90)}`);
    console.log(`    dst: profile-pictures/${storagePath}`);

    if (!DRY_RUN) {
      const buffer = await downloadImage(profile.avatar_url as string);
      const publicUrl = await uploadToStorage("profile-pictures", storagePath, buffer, ct);
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);
      if (dbError) throw new Error(`DB update failed for profile ${profile.id}: ${dbError.message}`);
      console.log(`    ✓ → ${publicUrl}`);
    }
  }

  return count;
}

// ── Migrate private_booking_links.cover_image_url ────────────────────────────

async function migrateLinkCovers(): Promise<number> {
  const { data: links, error } = await supabase
    .from("private_booking_links")
    .select("id, profile_id, link_slug, cover_image_url")
    .ilike("cover_image_url", "%dropbox%");

  if (error) throw error;

  const count = links?.length ?? 0;
  console.log(`\nprivate_booking_links.cover_image_url: ${count} Dropbox URL${count !== 1 ? "s" : ""} found`);

  for (const link of links ?? []) {
    const coverUrl = link.cover_image_url as string;
    const ext = extFromUrl(coverUrl);
    const ct = contentTypeFromExt(ext);
    const storagePath = `${link.profile_id}/links/${randomUUID()}.${ext}`;

    console.log(`  link ${link.link_slug} (id=${link.id})`);
    console.log(`    src: ${coverUrl.slice(0, 90)}${coverUrl.length > 90 ? "…" : ""}`);
    console.log(`    dst: profile-media/${storagePath}`);

    if (!DRY_RUN) {
      const buffer = await downloadImage(coverUrl);
      const publicUrl = await uploadToStorage("profile-media", storagePath, buffer, ct);
      const { error: dbError } = await supabase
        .from("private_booking_links")
        .update({ cover_image_url: publicUrl })
        .eq("id", link.id);
      if (dbError) throw new Error(`DB update failed for link ${link.id}: ${dbError.message}`);
      console.log(`    ✓ → ${publicUrl}`);
    }
  }

  return count;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN — pass --run to execute" : "LIVE RUN"}`);

  const photoCount = await migrateProfilePhotos();
  const avatarCount = await migrateAvatars();
  const coverCount = await migrateLinkCovers();

  const total = photoCount + avatarCount + coverCount;
  if (DRY_RUN) {
    console.log(`\n${total} URL${total !== 1 ? "s" : ""} would be migrated. Re-run with --run to execute.`);
  } else {
    console.log(`\nDone. ${total} URL${total !== 1 ? "s" : ""} migrated.`);
  }
}

main().catch((err) => {
  console.error("\nFatal:", err.message ?? err);
  process.exit(1);
});
