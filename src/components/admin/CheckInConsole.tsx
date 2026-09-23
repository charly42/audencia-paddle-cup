"use client";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, XCircle } from "lucide-react";
import { checkInAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { cn } from "@/lib/utils";
import { formatDateFr } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";

type Res = { result: string; label?: string; sub?: string; already?: string; at: number; raw: string };
const VIEW = {
  valid: { cls: "bg-ok text-white", icon: CheckCircle2, title: "a.valid" },
  already: { cls: "bg-warn text-white", icon: AlertTriangle, title: "a.already" },
  invalid: { cls: "bg-danger text-white", icon: XCircle, title: "a.invalid" },
} as const;

/** Check-in : scan QR (caméra) + saisie manuelle du code court ou du Team ID (APC-XXXXXX). */
export function CheckInConsole() {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const last = useRef<{ v: string; t: number }>({ v: "", t: 0 });
  const [cam, setCam] = useState<"off" | "starting" | "on" | "error">("off");
  const [camError, setCamError] = useState("");
  const [res, setRes] = useState<Res | null>(null);
  const [history, setHistory] = useState<Res[]>([]);
  const [manual, setManual] = useState("");
  const [pending, start] = useTransition();
  const t = useT();

  const submit = useCallback((raw: string) => {
    start(async () => {
      const r = await checkInAction(raw);
      const d = r.ok && r.data ? r.data : { result: "invalid" };
      const out: Res = { ...d, at: Date.now(), raw };
      setRes(out); setHistory((h) => [out, ...h].slice(0, 12));
      if (navigator.vibrate) navigator.vibrate(d.result === "valid" ? 60 : [80, 60, 80]);
    });
  }, []);

  const stop = useCallback(() => { const s = video.current?.srcObject as MediaStream | null; s?.getTracks().forEach((t) => t.stop()); if (video.current) video.current.srcObject = null; setCam("off"); }, []);
  useEffect(() => stop, [stop]);

  const startCam = async () => {
    setCam("starting"); setCamError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      const v = video.current!; v.srcObject = stream; await v.play(); setCam("on");
      const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      const detector = BD ? new BD({ formats: ["qr_code"] }) : null;
      const jsQR = detector ? null : (await import("jsqr")).default;
      const tick = async () => {
        if (!video.current?.srcObject) return;
        const el = video.current;
        if (el.readyState >= 2) {
          let value: string | null = null;
          try {
            if (detector) value = (await detector.detect(el))[0]?.rawValue ?? null;
            else if (jsQR && canvas.current) {
              const c = canvas.current, w = el.videoWidth, h = el.videoHeight, scale = Math.min(1, 640 / w);
              c.width = w * scale; c.height = h * scale;
              const ctx = c.getContext("2d", { willReadFrequently: true })!; ctx.drawImage(el, 0, 0, c.width, c.height);
              value = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height)?.data ?? null;
            }
          } catch { /* frame illisible */ }
          const now = Date.now();
          if (value && !(value === last.current.v && now - last.current.t < 4000)) { last.current = { v: value, t: now }; submit(value); }
        }
        setTimeout(tick, 200);
      };
      tick();
    } catch (e) { setCam("error"); setCamError(t("a.camError")); void e; }
  };

  const v = res ? VIEW[res.result as keyof typeof VIEW] ?? VIEW.invalid : null;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4">
        <div className="relative aspect-square max-w-md rounded-3xl overflow-hidden bg-ink grid place-items-center">
          <video ref={video} playsInline muted className={cn("absolute inset-0 w-full h-full object-cover", cam !== "on" && "hidden")} />
          <canvas ref={canvas} className="hidden" />
          {cam === "on" && <div aria-hidden className="absolute inset-[15%] rounded-3xl border-4 border-lime/90" />}
          {cam !== "on" && <div className="text-center text-white/80 p-6"><CameraOff className="mx-auto mb-2" aria-hidden /><p className="font-bold">{cam === "starting" ? t("a.camStarting") : t("a.camOff")}</p></div>}
        </div>
        {camError && <p role="alert" className="text-sm font-bold text-danger">⚠ {camError}</p>}
        <div className="flex gap-2">{cam === "on" ? <Button variant="dark" onClick={stop}><CameraOff size={18} aria-hidden />{t("a.stopScan")}</Button> : <Button onClick={startCam} disabled={cam === "starting"}><Camera size={18} aria-hidden />{t("a.startScan")}</Button>}</div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) { submit(manual); setManual(""); } }}>
          <Input aria-label={t("a.codeAria")} placeholder={t("a.codePh")} value={manual} onChange={(e) => setManual(e.target.value)} autoCapitalize="characters" autoComplete="off" />
          <Button type="submit" disabled={pending || !manual.trim()}>{t("a.check")}</Button>
        </form>
      </section>
      <section className="space-y-4" aria-live="assertive">
        {v && res ? (
          <div className={cn("rounded-3xl p-6 md:p-8", v.cls)} role="status">
            <v.icon size={56} aria-hidden /><p className="display text-5xl md:text-6xl mt-2">{t(v.title)}</p>
            {res.label && <p className="display-md text-3xl mt-3">{res.label}</p>}
            {res.sub && <p className="font-extrabold tracking-wider opacity-90">{res.sub}</p>}
            {res.already && <p className="mt-2 font-bold">{t("a.alreadyAt", { at: formatDateFr(res.already) })}</p>}
          </div>
        ) : <div className="rounded-3xl border-2 border-dashed border-ink/20 p-10 text-center font-semibold text-slate">{t("a.scanHint")}</div>}
        {history.length > 0 && <div className="rounded-3xl bg-white border border-ink/10 p-4"><h2 className="display-md text-2xl mb-2">{t("a.recentScans")}</h2>
          <ul className="divide-y divide-ink/10">{history.map((h) => <li key={h.at} className="py-2 flex justify-between gap-3 text-sm"><span className="font-extrabold truncate">{h.label ?? h.raw.slice(0, 18)}</span><span className={cn("font-extrabold shrink-0", h.result === "valid" ? "text-ok" : h.result === "already" ? "text-warn" : "text-danger")}>{t(VIEW[h.result as keyof typeof VIEW]?.title ?? "a.invalid")}</span></li>)}</ul></div>}
      </section>
    </div>
  );
}
