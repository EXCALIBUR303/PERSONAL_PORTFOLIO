"use client";
import EngineeringDesk from "./engineering-desk";
import ProjectGallery from "./project-gallery";
import GrowingToolkit from "./growing-toolkit";
import Contact from "./contact";
import ProAbout from "./pro-about";
import { useMode } from "./mode";
import CreativeHero from "./creative/creative-hero";
import CreativeGallery from "./creative/creative-gallery";
import {
  CreativeAbout,
  CreativeContact,
  CreativeToolkit,
} from "./creative/creative-sections";
export default function Portfolio() {
  const [mode] = useMode();
  if (mode === "creative") {
    return (
      <main id="main" tabIndex={-1} className="c-home">
        <CreativeHero />
        <CreativeGallery />
        <CreativeToolkit />
        <CreativeAbout />
        <CreativeContact />
      </main>
    );
  }
  return (
    <main id="main" tabIndex={-1}>
      <EngineeringDesk />
      <ProjectGallery />
      <GrowingToolkit />
      <ProAbout />
      <Contact />
    </main>
  );
}
