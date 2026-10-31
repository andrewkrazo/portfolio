import { About } from "@/components/About";
import { CityProvider } from "@/components/CityProvider";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { Work } from "@/components/Work";

export default function Page() {
  // No key in production means no answers, so don't offer the bar. Stays on in dev for working on it.
  const askEnabled = Boolean(process.env.ANTHROPIC_API_KEY) || process.env.NODE_ENV === "development";
  return (
    <CityProvider>
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
