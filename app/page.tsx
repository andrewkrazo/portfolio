import { About } from "@/components/About";
import { CityProvider } from "@/components/CityProvider";
import { Contact } from "@/components/Contact";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { Work } from "@/components/Work";

export default function Page() {
  return (
    <CityProvider>
      <Nav />
      <main>
        <Hero />
        <Work />
        <About />
        <Contact />
      </main>
    </CityProvider>
  );
}
