import "server-only";
import { isSupabaseConfigured } from "../env";
import { demoRepo } from "./demo";
import { supabaseRepo } from "./supabase";
import type { Repo } from "./types";

/** Point d'entrée unique de la donnée : Supabase si configuré, sinon mode démo en mémoire. */
export const repo: Repo = isSupabaseConfigured ? supabaseRepo : demoRepo;
export type { Repo } from "./types";
