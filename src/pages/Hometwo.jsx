import HomeHero from "../components/home/HomeHero";
import MarketingServices from "../components/home/MarketingServices";
import { useSEO } from "./useSEO";

/**
 * Home — the redesigned hero (dark, animated, interactive 3D characters and service cards) followed by
 * the "Marketing That Starts With Your Business Goals" band. The rest of the home page (About, Services,
 * Industries, Blogs, Contact) continues in App.jsx's SinglePage.
 */
export default function Hometwo() {
  useSEO("home");
  return (
    <>
      <HomeHero />
      <MarketingServices />
    </>
  );
}
