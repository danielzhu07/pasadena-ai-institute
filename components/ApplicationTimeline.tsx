import { site } from "@/lib/site";

const steps = [
  {
    when: site.cohort.dates.applyByShort,
    title: "Apply",
    detail:
      "Share a link to your resume or LinkedIn and answer a couple of quick questions. Applications are read on a rolling basis — earlier is better, since seats fill as we go.",
  },
  {
    when: site.cohort.dates.decisionsByShort,
    title: "Hear back",
    detail:
      "We review every application and hear from us in July. If you're accepted, we'll send you the exact venue in Pasadena. If not this time, you can apply for the next cohort.",
  },
  {
    when: site.cohort.dates.workshopShort,
    title: "Join the ten",
    detail:
      "The founding cohort meets in person in Pasadena in July 2026: one day, ten people, building something real.",
  },
];

export function ApplicationTimeline() {
  return (
    <ol className="border-t border-ink-200">
      {steps.map((s, i) => (
        <li
          key={s.title}
          className="grid gap-x-10 gap-y-2 border-b border-ink-100 py-7 sm:grid-cols-[10rem_1fr]"
        >
          <div className="flex items-baseline gap-4">
            <span className="font-serif text-2xl font-normal tabular-nums text-ink-300">
              0{i + 1}
            </span>
          </div>
          <div>
            <h3 className="font-serif text-2xl font-normal tracking-tight text-ink-900">
              {s.title}
            </h3>
            <p className="mt-2 max-w-[60ch] leading-relaxed text-ink-600">
              {s.detail}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
