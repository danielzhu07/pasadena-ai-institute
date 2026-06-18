import Link from "next/link";
import { Section, SectionHeading } from "@/components/Section";
import { TrackCard } from "@/components/TrackCard";
import { ApplicationTimeline } from "@/components/ApplicationTimeline";
import { AgendaTimeline } from "@/components/AgendaTimeline";
import { Reveal } from "@/components/Reveal";
import { ArtPanel } from "@/components/ui/art-panel";
import { GlassButton } from "@/components/ui/apple-tahoe-liquid-glass-button";
import { LiquidGlassCard } from "@/components/ui/liquid-weather-glass";
import { art } from "@/lib/art";
import { site } from "@/lib/site";
import { tracks, outcomes } from "@/lib/content";

export default function HomePage() {
  return (
    <>
      {/* Hero - Monet, Water Lilies */}
      <div className="relative">
        <ArtPanel
          art={art.waterLilies}
          video="/art/hero-lilies-4.mp4"
          height="hero"
          scrim="left"
          position="center"
          noScrim
        >
          <div className="container-x">
            <LiquidGlassCard
            draggable={false}
            blurIntensity="xl"
            shadowIntensity="xs"
            glowIntensity="none"
            borderRadius="8px"
            className="max-w-2xl animate-fade-in -mt-16 bg-white/8 px-8 py-9 text-white sm:px-10 sm:py-11 lg:-ml-20"
          >
            <h1 className="font-serif text-[clamp(2.75rem,6.5vw,5rem)] font-normal leading-[1.05] tracking-[-0.025em] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.45),0_1px_1px_rgba(0,0,0,0.35)]">
              Go from zero to one
              <br />
              with AI.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.55)]">
              A two-day, in-person atelier in Pasadena for executives and
              business owners. Come knowing nothing, or bring an idea. Leave
              having made something real. The founding cohort is just ten seats,
              by application.
            </p>
            <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Link href="/register" aria-label="Apply for a seat">
                <GlassButton size="lg" contentClassName="gap-2 text-white">
                  Apply for a seat
                  <span aria-hidden>→</span>
                </GlassButton>
              </Link>
              <Link
                href="/conference"
                className="text-sm font-medium text-white underline decoration-white/50 decoration-1 underline-offset-[6px] [text-shadow:0_1px_4px_rgba(0,0,0,0.55)] transition-colors hover:decoration-white"
              >
                See the two days
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.55)]">
              <span>
                {site.cohort.label} · {site.cohort.dates.workshop}
              </span>
              <span aria-hidden className="text-white/60">·</span>
              <span>In-person in {site.cohort.location}</span>
              <span aria-hidden className="text-white/60">·</span>
              <span>Ten seats</span>
              <span aria-hidden className="text-white/60">·</span>
              <span>Apply by {site.cohort.dates.applyByShort}</span>
            </div>
            </LiquidGlassCard>
          </div>
        </ArtPanel>

      </div>

      {/* Manifesto */}
      <Section className="bg-canvas">
        <Reveal className="grid gap-x-16 gap-y-8 lg:grid-cols-[1fr_1px_1fr]">
          <div>
            <h2 className="font-serif text-4xl font-normal leading-[1.2] tracking-tight text-ink-900 sm:text-5xl">
              Everyone says{" "}
              <span className="italic">“leverage AI.”</span> Almost no one shows
              you how, in a room, with real help.
            </h2>
          </div>
          <div aria-hidden className="hidden bg-ink-100 lg:block" />
          <div className="max-w-[60ch] space-y-5 text-lg leading-relaxed text-ink-600">
            <p>
              The free videos overwhelm. The webinars try to sell you. It&rsquo;s
              hard to know what&rsquo;s genuinely useful versus pure hype.
            </p>
            <p>
              So we built the opposite: two days, in person, in a small group,
              where we sit with you until it clicks, and you walk out with
              something you actually made.
            </p>
            <p>
              <Link href="/about" className="link-accent">
                The story behind the Workshop
              </Link>
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Two tracks */}
      <Section className="border-t border-ink-100 bg-canvas-soft">
        <Reveal>
          <SectionHeading
            title="Two ways in, one room"
            intro="Choose your path at the end of Day 1; both start from zero and end with something real."
          />
        </Reveal>
        <div className="mt-12 grid gap-px bg-ink-100 sm:grid-cols-2">
          {tracks.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <TrackCard track={t} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Outcomes */}
      <Section className="bg-canvas">
        <Reveal>
          <SectionHeading title="You don't leave with notes. You leave with results." />
        </Reveal>
        <dl className="mt-12 grid gap-x-16 gap-y-10 sm:grid-cols-2">
          {outcomes.map((o, i) => (
            <Reveal key={o.title} delay={i * 0.07}>
              <div className="border-t border-ink-200 pt-6">
                <dt className="font-serif text-2xl font-normal tracking-tight text-ink-900">
                  {o.title}
                </dt>
                <dd className="mt-3 max-w-[52ch] leading-relaxed text-ink-600">
                  {o.detail}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Section>

      {/* Quote interlude - Van Gogh */}
      <ArtPanel art={art.bedroom} height="band" scrim="full" position="center">
        <div className="container-x text-center">
          <blockquote className="mx-auto max-w-3xl">
            <p className="font-serif text-3xl font-normal italic leading-[1.2] tracking-tight text-white sm:text-4xl">
              “The best way to predict the future is to invent it.”
            </p>
            <footer className="mt-5 text-sm font-medium uppercase tracking-[0.18em] text-white/65">
              Alan Kay
            </footer>
          </blockquote>
        </div>
      </ArtPanel>

      {/* Agenda */}
      <Section id="agenda" className="bg-canvas-soft">
        <Reveal>
          <SectionHeading
            title="A clear, hour-by-hour path"
            intro="Foundations and fluency on Day 1. Build something real on Day 2. Working lunches and expert help throughout."
          />
        </Reveal>
        <Reveal delay={0.1} className="mt-12">
          <AgendaTimeline />
        </Reveal>
      </Section>

      {/* How to claim a seat */}
      <Section className="bg-canvas">
        <Reveal>
          <SectionHeading
            title="Claim one of ten seats"
            intro="This is our founding cohort, the first time we're running it. Seats are earned by application, not payment, and we review on a rolling basis. The room is small on purpose."
          />
        </Reveal>
        <Reveal delay={0.1} className="mt-12">
          <ApplicationTimeline />
        </Reveal>
        <Reveal delay={0.15} className="mt-10">
          <Link href="/register" className="btn-primary">
            Apply for a seat
          </Link>
        </Reveal>
      </Section>

      {/* Closing - Monet, Water Lily Pond (bookends the hero) */}
      <ArtPanel
        art={art.waterLilyPond}
        height="tall"
        scrim="left"
        position="center"
        kenBurns={false}
        dim
      >
        <div className="container-x py-28">
          <div className="max-w-xl">
            <h2 className="font-serif text-4xl font-normal leading-[1.18] tracking-tight text-white sm:text-6xl">
              Ten seats. One founding cohort.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/90">
              The first time we&rsquo;re running this, in Pasadena on{" "}
              {site.cohort.dates.workshop}. Applications close{" "}
              {site.cohort.dates.applyByShort}.
            </p>
            <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Link href="/register" aria-label="Apply for a seat">
                <GlassButton size="lg" contentClassName="gap-2 text-white">
                  Apply for a seat
                  <span aria-hidden>→</span>
                </GlassButton>
              </Link>
              <Link
                href="/faq"
                className="text-sm font-medium text-white/80 underline decoration-white/30 decoration-1 underline-offset-[6px] transition-colors hover:decoration-white"
              >
                How it works
              </Link>
            </div>
          </div>
        </div>
      </ArtPanel>
    </>
  );
}
