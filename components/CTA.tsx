import Link from "next/link";
import { ArtPanel } from "@/components/ui/art-panel";
import { GlassButton } from "@/components/ui/apple-tahoe-liquid-glass-button";
import { art } from "@/lib/art";
import { site } from "@/lib/site";

export function CTABand() {
  return (
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
          <h2 className="font-serif text-4xl font-normal leading-[1.1] tracking-tight text-white sm:text-6xl">
            Ten seats. One founding cohort.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/90">
            The first time we&rsquo;re running this, in person in Pasadena in{" "}
            {site.cohort.season}.
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
  );
}
