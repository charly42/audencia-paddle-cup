import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "./supabase/admin";
import { isSupabaseConfigured } from "./env";

const MAX = 5 * 1024 * 1024;
function detect(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png" };
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return { mime: "image/webp", ext: "webp" };
  return null; // le type est déterminé par les octets, jamais par le nom / Content-Type client
}

/** Upload sécurisé d'une photo (jpeg/png/webp ≤ 5 Mo). Retourne l'URL publique. */
export async function uploadPhoto(file: File, folder = "teams"): Promise<string> {
  if (file.size > MAX) throw new Error("err.photoSize");
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = detect(buf);
  if (!kind) throw new Error("err.photoFormat");
  if (!isSupabaseConfigured) {
    if (buf.length > 1.5 * 1024 * 1024) throw new Error("err.photoDemo");
    return `data:${kind.mime};base64,${buf.toString("base64")}`;
  }
  const supabase = createAdminClient();
  const path = `${folder}/${randomUUID()}.${kind.ext}`;
  const { error } = await supabase.storage.from("team-photos").upload(path, buf, { contentType: kind.mime, upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("team-photos").getPublicUrl(path).data.publicUrl;
}
