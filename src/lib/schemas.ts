import { z } from "zod";

// Les messages sont des clés de traduction (lib/i18n) : le formulaire les affiche via t().
const name = z.string().trim().min(1, "v.required").max(60);
const email = z.string().trim().toLowerCase().email("v.email").max(120);
const phone = z.string().trim().min(6, "v.phone").max(25).regex(/^[+\d][\d\s().-]+$/, "v.phone");
const skill = z.enum(["beginner", "intermediate", "advanced"]);

export const playerSchema = z.object({ firstName: name, lastName: name, email, phone, skillLevel: skill });

export const registerSchema = z.object({
  teamName: z.string().trim().min(2, "v.min2").max(40),
  promotionId: z.string().min(1, "v.promotion"),
  program: z.string().trim().min(2, "v.required").max(80),
  players: z.tuple([playerSchema, playerSchema]),
  acceptRules: z.literal(true, { errorMap: () => ({ message: "v.rules" }) }),
  imageRights: z.literal(true, { errorMap: () => ({ message: "v.imageRights" }) }),
  acceptConditions: z.literal(true, { errorMap: () => ({ message: "v.conditions" }) }),
  website: z.string().max(0).optional(), // honeypot anti-spam
});
export type RegisterValues = z.infer<typeof registerSchema>;

export const ticketSchema = z.object({
  firstName: name, lastName: name, email,
  ticketType: z.enum(["spectator", "supporter", "staff", "player"]),
  promotionId: z.string().optional().nullable(),
  website: z.string().max(0).optional(),
});
export type TicketValues = z.infer<typeof ticketSchema>;

export const loginSchema = z.object({ email });

export const scoreSchema = z.object({ matchId: z.string().min(1), scoreA: z.number().int().min(0).max(99), scoreB: z.number().int().min(0).max(99) });

export const matchStatusSchema = z.enum(["upcoming", "check_in", "warm_up", "live", "final", "postponed", "cancelled"]);
export const settingsSchema = z.object({
  eventName: z.string().trim().min(2).max(80), venue: z.string().trim().max(120), headline: z.string().trim().max(80), tagline: z.string().trim().max(120),
  eventDate: z.string().nullable(), registrationDeadline: z.string().nullable(),
  registrationOpen: z.boolean(), ticketingOpen: z.boolean(), sponsorsEnabled: z.boolean(), supportersAwardEnabled: z.boolean(),
  predictionsEnabled: z.boolean(), cheersEnabled: z.boolean(), galleryEnabled: z.boolean(), volunteersEnabled: z.boolean(),
  ticketCapacity: z.number().int().min(1).nullable(),
});
export const practiceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), startTime: z.string().regex(/^\d{2}:\d{2}$/), durationMin: z.number().int().min(15).max(300),
  courtsCount: z.number().int().min(1).max(8), capacity: z.number().int().min(2).max(64), coach: z.boolean(),
  level: z.enum(["all", "beginner", "intermediate", "advanced"]),
});

export const predictionSchema = z.object({
  matchId: z.string().min(1),
  teamId: z.string().min(1),
  displayName: z.string().trim().min(2, "v.min2").max(24, "v.max24"),
});
export const cheerSchema = z.object({
  teamId: z.string().min(1),
  author: z.string().trim().min(2, "v.min2").max(30),
  message: z.string().trim().min(3, "v.tooShort").max(200, "v.max200"),
  website: z.string().max(0).optional(), // honeypot anti-spam
});
export const shiftSchema = z.object({
  role: z.string().trim().min(2).max(40),
  startsAt: z.string().min(1), endsAt: z.string().min(1),
  courtId: z.string().nullable(), capacity: z.number().int().min(1).max(20), notes: z.string().max(200).nullable(),
});
export const photoSchema = z.object({
  url: z.string().url("URL invalide").max(500),
  caption: z.string().max(140).nullable(), credit: z.string().max(80).nullable(), teamId: z.string().nullable(),
});
export const announcementSchema = z.object({
  fr: z.string().max(200), en: z.string().max(200),
  level: z.enum(["info", "warning", "urgent"]),
  until: z.string().nullable(),
});
