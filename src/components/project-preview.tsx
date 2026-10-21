import {
  ArrowUpRight,
  AudioLines,
  Command,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { Project } from "@/data/projects";
export default function ProjectPreview({ type }: { type: Project["preview"] }) {
  if (type === "orbit")
    return (
      <div className="preview preview-orbit" aria-hidden="true">
        <div className="preview-grain" />
        <span className="preview-caption">A CLEARER HEADSPACE.</span>
        <div className="orbit-window">
          <aside>
            <div className="orbit-logo">
              <Command size={17} /> orbit
            </div>
            <span>YOUR SPACE</span>
            <b className="orbit-selected">◫ &nbsp; Overview</b>
            <b>☷ &nbsp; My projects</b>
            <b>◷ &nbsp; Activity</b>
            <div className="orbit-bottom">
              A little more focus.
              <br />A little less noise.
            </div>
          </aside>
          <div className="orbit-main">
            <div className="orbit-top">
              <span>Workspace / Overview</span>
              <Search size={11} />
            </div>
            <div className="orbit-greeting">
              <small>MAKE ROOM FOR GOOD WORK</small>
              <h4>
                A fresh perspective<span>✳</span>
              </h4>
              <p>Let’s make something meaningful today.</p>
            </div>
            <div className="orbit-stats">
              <div>
                <i>IN THE FLOW</i>
                <strong>
                  03<span> projects</span>
                </strong>
              </div>
              <div>
                <i>ROOM TO GROW</i>
                <strong>
                  ∞<span> possibilities</span>
                </strong>
              </div>
            </div>
            <div className="orbit-task">
              <b>Today’s little victories</b>
              <Plus size={12} />
            </div>
            <p className="orbit-check">
              ✓ <span>Find a starting point</span>
              <i>Done</i>
            </p>
            <p className="orbit-check">
              ○ <span>Make something you love</span>
              <i>In progress</i>
            </p>
          </div>
        </div>
        <div className="floating-note">
          ✦ &nbsp; Less noise. More possibility.
        </div>
      </div>
    );
  if (type === "resonance")
    return (
      <div className="preview preview-resonance" aria-hidden="true">
        <span className="preview-caption">EXPLORATIONS IN FREQUENCY / 002</span>
        <div className="sound-sculpture">
          {Array.from({ length: 22 }, (_, i) => (
            <i key={i} style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>
        <div className="resonance-title">
          reso<span>nance</span>
          <AudioLines size={30} />
        </div>
        <div className="resonance-footer">
          <span>FEEL THE FREQUENCY</span>
          <span>↗</span>
        </div>
      </div>
    );
  if (type === "fieldnotes")
    return (
      <div className="preview preview-fieldnotes" aria-hidden="true">
        <div className="landscape">
          <i />
          <i />
          <i />
        </div>
        <div className="field-top">
          <b>
            fieldnotes<span>↟</span>
          </b>
          <span>GO SOMEWHERE GOOD ↗</span>
        </div>
        <div className="field-title">
          Take the
          <br />
          <em>long way.</em>
        </div>
        <div className="field-card">
          <span>YOUR NEXT CHAPTER</span>
          <strong>Somewhere off the beaten path.</strong>
          <ArrowUpRight size={20} />
        </div>
        <span className="field-coordinates">
          45° 31′ N &nbsp; 122° 40′ W · ILLUSTRATIVE
        </span>
      </div>
    );
  return (
    <div className="preview preview-chromatic" aria-hidden="true">
      <div className="chromatic-top">
        <b>chromatic®</b>
        <SlidersHorizontal size={18} />
      </div>
      <div className="color-blocks">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="chromatic-bottom">
        <span>
          A STUDY IN
          <br />
          HAPPY COMBINATIONS.
        </span>
        <strong>
          Let it
          <br />
          <em>happen.</em>
        </strong>
      </div>
    </div>
  );
}
