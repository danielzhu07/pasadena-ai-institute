import Link from "next/link";
import { site } from "@/lib/site";

const includes = [
  "Two full days, in-person in Pasadena",
  "A cohort of ten, with real personal attention",
  "All software set up on your own laptop",
  "Working lunches both days",
  "All materials & resources",
  "A workflow or prototype you built",
  "A personalized next-steps plan",
  "The founding alumni community",
];

export function ApplyCard() {
  return (
    <div className="rounded-[4px] bg-ink-950 p-9 text-canvas sm:p-12">
      <p className="eyebrow text-white/50">
        {site.cohort.label} · {site.cohort.season}
      </p>

      <div className="mt-7 flex items-baseline gap-3">
        <span className="font-serif text-6xl font-normal tracking-tight text-white">
          Ten seats.
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/65">
        The first cohort, in person in Pasadena on {site.cohort.dates.workshop}.
        Seats are earned by application first; accepted applicants can use
        checkout codes for discounts or scholarships.
      </p>

      <ul className="mt-8 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
        {includes.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-white/85">
            <span aria-hidden className="mt-px text-white/45">
              ·
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <Link
          href="/register"
          className="btn w-full bg-canvas text-ink-900 hover:bg-white"
        >
          Apply for a seat
        </Link>
      </div>
      <p className="mt-4 text-center text-xs text-white/45">
        Reviewed on a rolling basis · applications close{" "}
        {site.cohort.dates.applyByShort}.
      </p>
    </div>
  );
}
