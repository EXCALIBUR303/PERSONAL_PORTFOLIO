"use client";
import { lazyView } from "./lazy-view";
import { useEffect, useRef, useState } from "react";
import { useMode } from "@/components/mode";
import { dogCommands, matchCommand, pipeline, type DogCommand } from "./dog-data";
import { SceneToolbar, useSceneControls } from "./scene-controls";
import { useWebGL } from "./use-webgl";

const DogCanvas = lazyView(() => import("./three/dog-canvas"), () => <div className="s3-loading mono">Loading the robot dog…</div>);
/** Fetches the 3D canvas code early, so a scene built during a mode switch is ready at once. */
export const preloadCanvas = () => DogCanvas.preload();

/** Robot-dog simulation: a command travels the documented chain, then the 3D dog moves. */
export default function DogScene() {
  const [mode] = useMode();
  const webgl = useWebGL();
  const controls = useSceneControls();
  const joints = useRef<number[]>(new Array(12).fill(0));
  const [command, setCommand] = useState<DogCommand>(dogCommands[4]);
  const [heard, setHeard] = useState("");
  const [parsed, setParsed] = useState<DogCommand>(dogCommands[4]);
  const [stage, setStage] = useState(-1);
  const [text, setText] = useState("");
  const [miss, setMiss] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const issue = (next: DogCommand, phrase: string) => {
    timers.current.forEach((t) => window.clearTimeout(t));
    setMiss(false);
    setHeard(phrase);
    setParsed(next);
    setStage(0);
    timers.current = pipeline.map((_, i) =>
      window.setTimeout(() => {
        setStage(i);
        if (i === pipeline.length - 1) setCommand(next);
      }, i * 260),
    );
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const match = matchCommand(text);
    if (match) issue(match, text);
    else setMiss(true);
  };

  const flat = (
    <p className="lz-note">3D is not available here. The steps below still show how the command is handled.</p>
  );
  return (
    <div className="lz-viz s3-dog">
      <SceneToolbar controls={controls} />
      {webgl ? (
        <DogCanvas command={command} joints={joints} mode={mode} paused={controls.paused} resetKey={controls.resetKey} fallback={flat} />
      ) : webgl === false ? (
        flat
      ) : (
        <div className="s3-loading mono">Checking for 3D support…</div>
      )}
      <div className="lz-chips" role="group" aria-label="Commands">
        {dogCommands.map((c) => (
          <button key={c.id} type="button" aria-pressed={command.id === c.id} onClick={() => issue(c, c.phrase)}>
            {c.label}
          </button>
        ))}
      </div>
      <form className="s3-say" onSubmit={submit}>
        <label htmlFor="dog-say" className="mono">Or type a command</label>
        <input id="dog-say" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. turn left" />
        <button type="submit">Send</button>
      </form>
      {controls.paused && stage === pipeline.length - 1 && webgl && (
        <p className="s3-hint" role="status">
          Motion is paused. Press Resume motion to watch the dog carry out the command.
        </p>
      )}
      {miss && (
        <p className="s3-hint" role="status">
          Not understood. This keyword stand-in only knows walk, back, left, right and stop.
        </p>
      )}
      <ol className="lz-stages" aria-live="polite">
        {pipeline.map((p, i) => (
          <li key={p.id} aria-current={i === stage ? "step" : undefined}>
            <span>{p.label}</span>
            {i === 0 && heard ? `“${heard}”` : i === 1 && stage >= 1 ? `speed ${parsed.speed}, turn ${parsed.turn}, “${parsed.reply}”` : i === 2 && stage >= 2 ? parsed.mode : p.note}
          </li>
        ))}
      </ol>
      <p className="s3-fine">
        Simulation. A keyword matcher stands in for the language model, the speed and turn values are illustrative, and the trot is hand-written rather than the trained PPO policy.
      </p>
    </div>
  );
}
