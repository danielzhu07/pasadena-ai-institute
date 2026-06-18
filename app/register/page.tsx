import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { PageHero } from "@/components/PageHero";
import { ApplicationForm } from "@/components/ApplicationForm";
import { ApplicationTimeline } from "@/components/ApplicationTimeline";
import { CheckoutButton } from "@/components/CheckoutButton";
import { art } from "@/lib/art";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Apply",
  description:
    "Apply for one of ten seats in the Pasadena AI Workshop founding cohort. Share your resume or LinkedIn and a couple of quick answers, reviewed on a rolling basis.",
};

const included = [
  "Two full days, in-person in Pasadena",
  "A cohort of ten, with real personal attention",
  "All software set up on your own laptop",
  "Working lunches both days",
  "A workflow or prototype you built",
  "A personalized next-steps plan",
];

export default function RegisterPage() {
  return (
    <>
      <PageHero
        eyebrow={`${site.cohort.label} · ${site.cohort.dates.workshop} · ${site.cohort.location}`}
        title="Claim your seat"
        intro={`Ten seats in the founding cohort, earned by application first. The application is free. Accepted applicants reserve a ${site.price.display} seat through Stripe, with discount and scholarship codes available for $500 or free seats. We review on a rolling basis and close ${site.cohort.dates.applyBy}.`}
        artwork={art.grandeJatte}
      />

      <Section className="bg-canvas">
        <div className="grid gap-x-16 gap-y-14 lg:grid-cols-[0.85fr_1.15fr]">
          {/* How it works + what you get */}
          <div>
            <h2 className="font-serif text-3xl font-normal tracking-tight text-ink-900 sm:text-4xl">
              How it works
            </h2>
            <div className="mt-8">
              <ApplicationTimeline />
            </div>

            <h3 className="mt-12 font-serif text-2xl font-normal tracking-tight text-ink-900">
              What a seat includes
            </h3>
            <ul className="mt-5 border-t border-ink-200">
              {included.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 border-b border-ink-100 py-3.5 text-sm text-ink-700"
                >
                  <span aria-hidden className="text-accent">
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-[4px] border border-ink-200 bg-surface p-6">
              <h3 className="font-serif text-2xl font-normal tracking-tight text-ink-900">
                Accepted applicants
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                Standard seats are {site.price.display}. Use your Stripe code
                at checkout for a $500 discounted seat or a full scholarship.
              </p>
              <div className="mt-5">
                <CheckoutButton />
              </div>
            </div>
          </div>

          {/* The application */}
          <div id="apply" className="scroll-mt-28">
            <h2 className="font-serif text-3xl font-normal tracking-tight text-ink-900 sm:text-4xl">
              Your application
            </h2>
            <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-ink-600">
              If it&rsquo;s not this time, you can apply for the next cohort.
            </p>
            <div className="mt-7">
              <ApplicationForm />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
