import { isDatabaseEnabled, supabase } from "./supabase";

const BUCKET = "member-avatars";
const MAX_BYTES = 2 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.readAsDataURL(file);
  });
}

function safePathSegment(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "member";
}

export async function uploadMemberAvatar(file, email) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Please choose an image file (JPG, PNG, or WebP)");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 2 MB or smaller");
  }

  if (!isDatabaseEnabled) {
    return readFileAsDataUrl(file);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${safePathSegment(email)}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
