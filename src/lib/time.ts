/** Helpers de fuseau Europe/Paris (indépendants de l'heure du serveur, souvent en UTC). */
const TZ = "Europe/Paris";

function paris(t: number) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" })
      .formatToParts(new Date(t)).map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
}
export function parisIso(dateStr: string, hhmm: string) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const utc = Date.UTC(y, mo - 1, d, h, mi);
  let guess = utc - (paris(utc) - utc);
  guess = utc - (paris(guess) - guess);
  return new Date(guess).toISOString();
}
export function parisDay(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD
}

