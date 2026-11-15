import { About } from "@/components/About";
import { CityProvider } from "@/components/CityProvider";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { Work } from "@/components/Work";
import { getHere } from "@/lib/here";
import { herePaintScript } from "@/lib/sky";

type Props = { searchParams: Promise<{ here?: string; weather?: string }> };

export default async function Page({ searchParams }: Props) {
  // No key in production means no answers, so don't offer the bar. Stays on in dev for working on it.
  const askEnabled = Boolean(process.env.ANTHROPIC_API_KEY) || process.env.NODE_ENV === "development";
  const params = await searchParams;
  const here = await getHere(params.here, params.weather);
  return (
    <CityProvider here={here}>
      {here && <script dangerouslySetInnerHTML={{ __html: herePaintScript(here) }} />}
      <Nav />
      <main>
        <Hero askEnabled={askEnabled} />
        <Work />
        <About />
        <Contact />
      </main>
    </CityProvider>
  );
}
