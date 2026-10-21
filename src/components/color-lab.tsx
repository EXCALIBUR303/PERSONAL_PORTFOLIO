"use client";
import { useState, type CSSProperties } from "react";
import { Check, RotateCcw } from "lucide-react";
import { SectionLabel, Reveal } from "./ui";
export default function ColorLab() {
  const [palette, setPalette] = useState(0);
  const [intensity, setIntensity] = useState(45);
  const [playing, setPlaying] = useState(true);
  const palettes = [
    { name: "Lilac & lime", colors: ["#ac8cf4", "#d5f86e", "#f59c79"] },
    { name: "Coral & blue", colors: ["#f18c79", "#96c9ed", "#efd89e"] },
    { name: "Mint & rose", colors: ["#9ed6bc", "#ecacc8", "#b9a1ee"] },
  ];
  const colors = palettes[palette].colors;
  return (
    <section id="lab" className="lab-section section-pad">
      <div className="container">
        <SectionLabel number="05">A LITTLE PLAY GOES A LONG WAY</SectionLabel>
        <div className="lab-layout">
          <Reveal className="lab-copy">
            <span className="eyebrow">THE INTERACTIVE LAB</span>
            <h2>
              Serious about
              <br />
              being <em>playful.</em>
            </h2>
            <p>
              Sometimes the best way to find an idea is to play with one. Change
              a color. Shift the shape. See where it takes you.
            </p>
            <span className="lab-footnote mono">
              EXPERIMENT 001 / COLOR FIELD
            </span>
          </Reveal>
          <div className="lab-console">
            <div className="lab-console-top">
              <span>
                <i /> COLOR FIELD
              </span>
              <button
                onClick={() => {
                  setPalette(0);
                  setIntensity(45);
                  setPlaying(true);
                }}
                aria-label="Reset color field"
              >
                <RotateCcw size={15} />
              </button>
            </div>
            <div
              className="color-field"
              style={
                {
                  "--color-a": colors[0],
                  "--color-b": colors[1],
                  "--color-c": colors[2],
                  "--spread": `${intensity * 0.4}px`,
                  "--play-state": playing ? "running" : "paused",
                } as CSSProperties
              }
              role="img"
              aria-label={`Abstract color field in ${palettes[palette].name}, spread ${intensity} percent`}
            >
              <span className="field-circle circle-a" />
              <span className="field-circle circle-b" />
              <span className="field-circle circle-c" />
              <div className="field-cross" aria-hidden="true">
                +
              </div>
              <span className="field-axis mono" aria-hidden="true">
                X: POSSIBILITY &nbsp; Y: CURIOSITY
              </span>
            </div>
            <div className="lab-controls">
              <div
                className="palette-controls"
                role="group"
                aria-label="Color field palette"
              >
                {palettes.map((p, i) => (
                  <button
                    key={p.name}
                    aria-label={p.name}
                    aria-pressed={palette === i}
                    onClick={() => setPalette(i)}
                    style={{
                      background: `linear-gradient(135deg, ${p.colors[0]} 50%, ${p.colors[1]} 50%)`,
                    }}
                  >
                    {palette === i && <Check size={14} />}
                  </button>
                ))}
              </div>
              <label className="spread-label">
                Spread{" "}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={intensity}
                  onChange={(e) => setIntensity(+e.target.value)}
                />
                <output>{intensity}</output>
              </label>
              <button
                className="lab-play"
                onClick={() => setPlaying(!playing)}
                aria-pressed={!playing}
              >
                {playing ? "Pause" : "Play"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
