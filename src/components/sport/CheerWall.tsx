"use client";
import { useState, useTransition } from "react";
import { MessageCircleHeart } from "lucide-react";
import { sendCheerAction } from "@/lib/actions/engagement";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { formatDateFr } from "@/lib/format";
import type { Cheer } from "@/lib/types";

/** Mur d'encouragements d'une équipe. Les messages sont publiés après validation par l'organisation. */
export function CheerWall({ teamId, cheers, labels }: {
  teamId: string; cheers: Cheer[];
  labels: { title: string; cta: string; name: string; message: string; sent: string; empty: string; moderated: string };
}) {
  const [author, setAuthor] = useState(""), [message, setMessage] = useState(""), [hp, setHp] = useState("");
  const [pending, start] = useTransition();
  const { toast } = useToast();
  return (
    <section aria-label={labels.title} className="rounded-3xl bg-white border border-ink/10 p-6">
      <h2 className="display-md text-3xl flex items-center gap-2"><MessageCircleHeart size={24} aria-hidden />{labels.title}</h2>
      <p className="text-xs font-semibold text-slate mt-1">{labels.moderated}</p>

      <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end" onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await sendCheerAction({ teamId, author, message, website: hp });
          if (r.ok) { setAuthor(""); setMessage(""); toast(labels.sent); } else toast(r.error ?? "Erreur", "error");
        });
      }}>
        <Input aria-label={labels.name} placeholder={labels.name} value={author} maxLength={30} required onChange={(e) => setAuthor(e.target.value)} />
        <Textarea aria-label={labels.message} placeholder={labels.message} value={message} maxLength={200} required rows={2} className="!min-h-12" onChange={(e) => setMessage(e.target.value)} />
        <div aria-hidden className="absolute -left-[9999px]"><label>Website<input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></label></div>
        <Button type="submit" disabled={pending || author.trim().length < 2 || message.trim().length < 3}>{labels.cta}</Button>
      </form>

      {cheers.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {cheers.map((c) => (
            <li key={c.id} className="rounded-2xl bg-paper p-4">
              <p className="font-semibold">“{c.message}”</p>
              <p className="mt-2 text-xs font-extrabold tracking-wider text-slate">{c.author} · {formatDateFr(c.createdAt)}</p>
            </li>
          ))}
        </ul>
      ) : <p className="mt-6 text-slate font-semibold">{labels.empty}</p>}
    </section>
  );
}
