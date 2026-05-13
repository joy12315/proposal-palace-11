import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const createSchema = z.object({
  audio_path: z.string().min(1).max(200),
  duration_seconds: z.number().int().min(0).max(600),
  destination: z.enum(["vault", "archive", "letter"]),
  deliver_at: z
    .string()
    .datetime()
    .nullable()
    .optional(),
  location: z.string().max(120).nullable().optional(),
});

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TEN_YEARS_MS = 10 * 365 * ONE_DAY_MS;

export const createCapsule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // path must be `${userId}/<timestamp>.webm`
    const pathRe = new RegExp(`^${userId}\\/\\d+\\.webm$`);
    if (!pathRe.test(data.audio_path)) {
      throw new Error("invalid audio_path");
    }

    if (data.destination === "letter") {
      if (!data.deliver_at) throw new Error("deliver_at required for letter");
      const t = new Date(data.deliver_at).getTime();
      const now = Date.now();
      if (t < now + ONE_DAY_MS || t > now + TEN_YEARS_MS) {
        throw new Error("deliver_at out of range (1 day ~ 10 years)");
      }
    }

    const { error, data: row } = await supabase
      .from("capsules")
      .insert({
        user_id: userId,
        audio_path: data.audio_path,
        duration_seconds: data.duration_seconds,
        destination: data.destination,
        deliver_at: data.deliver_at ?? null,
        location: data.location ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const openTodaysLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    // already opened today?
    const { data: opened } = await supabase
      .from("capsules")
      .select("*")
      .eq("user_id", userId)
      .eq("destination", "letter")
      .gte("delivered_at", todayStart.toISOString())
      .limit(1);
    if (opened && opened.length > 0) return { state: "opened_today" as const, capsule: opened[0] };

    const { data: due } = await supabase
      .from("capsules")
      .select("*")
      .eq("user_id", userId)
      .eq("destination", "letter")
      .is("delivered_at", null)
      .lte("deliver_at", new Date().toISOString())
      .order("deliver_at", { ascending: true })
      .limit(1);

    if (!due || due.length === 0) {
      const { count } = await supabase
        .from("capsules")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("destination", "letter")
        .is("delivered_at", null);
      return { state: "empty" as const, in_transit: count ?? 0 };
    }

    const letter = due[0];
    const { data: updated, error } = await supabase
      .from("capsules")
      .update({ delivered_at: new Date().toISOString() })
      .eq("id", letter.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { state: "delivered" as const, capsule: updated };
  });