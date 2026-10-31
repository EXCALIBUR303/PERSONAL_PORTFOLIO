"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ArrowUpRight, RotateCcw, Target } from "lucide-react";
import { resolvePenalty, type Aim } from "@/lib/penalty";
export default function PenaltyWorld() {
  const [aim, setAim] = useState<Aim>("Center"),
    [power, setPower] = useState(65),
    [round, setRound] = useState(0),
    [goals, setGoals] = useState(0),
    [phase, setPhase] = useState<"ready" | "flight" | "done">("ready");
  const [shot, setShot] = useState<ReturnType<typeof resolvePenalty> | null>(
    null,
  );
  const reduced = useReducedMotion();
  useEffect(() => {
    if (phase !== "flight") return;
    const timer = setTimeout(
      () => {
        setPhase("done");
        setRound((value) => value + 1);
        if (shot?.result === "Goal") setGoals((value) => value + 1);
      },
      reduced ? 0 : 650,
    );
    return () => clearTimeout(timer);
  }, [phase, shot, reduced]);
  const keeperX =
      shot && phase !== "ready"
        ? { Left: 230, Center: 360, Right: 490 }[shot.keeper]
        : 360,
    ballX =
      phase === "ready"
        ? 360
        : shot?.result === "Wide"
          ? 630
          : { Left: 235, Center: 360, Right: 485 }[aim],
    ballY = phase === "ready" ? 340 : shot?.result === "Wide" ? 95 : 165;
  function shoot() {
    setShot(resolvePenalty(aim, power, round));
    setPhase("flight");
  }
  return (
    <div className="interactive-module penalty-module">
      <div className="module-toolbar">
        <div>
          <span className="eyebrow">
            PENALTY LAB / INDEPENDENT PORTFOLIO GAME
          </span>
          <p>Choose a direction. Set your power. Make the moment count.</p>
        </div>
        <div className="penalty-score">
          <span>
            GOALS <strong>{goals}</strong>
          </span>
          <span>
            SHOTS <strong>{round}</strong>
          </span>
          <button
            className="icon-button"
            aria-label="Reset penalty game"
            onClick={() => {
              setRound(0);
              setGoals(0);
              setPhase("ready");
              setShot(null);
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <div className="penalty-pitch">
        <svg
          viewBox="0 0 720 420"
          role="img"
          aria-label={`Penalty pitch. Aim ${aim}, power ${power}. ${phase === "done" ? shot?.result : "Ready for a shot"}.`}
        >
          <defs>
            <pattern
              id="pitch-lines"
              width="90"
              height="420"
              patternUnits="userSpaceOnUse"
            >
              <rect width="45" height="420" fill="#ffffff04" />
            </pattern>
            <pattern
              id="goal-net"
              width="18"
              height="18"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 0H18V18"
                fill="none"
                stroke="#bce3cd"
                strokeOpacity=".35"
              />
            </pattern>
          </defs>
          <rect width="720" height="420" fill="#204c3c" />
          <rect width="720" height="420" fill="url(#pitch-lines)" />
          <path
            d="M110 420L185 150H535L610 420M185 150H535M255 420L285 280H435L465 420"
            fill="none"
            stroke="#b7d9bd"
            strokeOpacity=".65"
          />
          <path
            d="M275 340Q360 295 445 340"
            fill="none"
            stroke="#b7d9bd"
            strokeOpacity=".5"
          />
          <path
            d="M205 170V75H515V170"
            fill="url(#goal-net)"
            stroke="#e4f0de"
            strokeWidth="5"
          />
          <path
            d="M205 75L225 55H495L515 75M495 55V145L515 170M225 55V145L205 170"
            fill="none"
            stroke="#bce3cd"
            strokeWidth="2"
          />
          <g
            className="goalkeeper"
            style={{ transform: `translateX(${keeperX - 360}px)` }}
          >
            <circle cx="360" cy="130" r="11" fill="#f1c798" />
            <path
              d="M360 145V182M338 155L360 146L382 155M360 180L345 204M360 180L375 204"
              stroke="#eeb86b"
              strokeWidth="13"
              strokeLinecap="round"
            />
          </g>
          <g
            className="penalty-ball"
            style={{
              transform: `translate(${ballX - 360}px,${ballY - 340}px)`,
            }}
          >
            <circle cx="360" cy="340" r="12" fill="#f7f3e5" />
            <path d="M354 337L360 332L366 337L364 345H356Z" fill="#27372d" />
          </g>
          {phase === "ready" && (
            <g stroke="#d5f86e" strokeOpacity=".7" fill="none">
              <path
                d={`M360 320L${{ Left: 235, Center: 360, Right: 485 }[aim]} 195`}
                strokeDasharray="5 7"
              />
              <circle
                cx={{ Left: 235, Center: 360, Right: 485 }[aim]}
                cy="180"
                r="13"
              />
            </g>
          )}
          <text x="30" y="35" fill="#d9edd9" fontSize="10" letterSpacing="2">
            LOCAL PLAY / NO PRIVATE SOURCE USED
          </text>
        </svg>
        <div className="penalty-result" role="status">
          {phase === "flight"
            ? "Shot in motion…"
            : phase === "done"
              ? `${shot?.result}! ${shot?.result === "Wide" ? "Power was too high." : `Goalkeeper went ${shot?.keeper.toLowerCase()}.`}`
              : "Your moment. Pick a corner."}
        </div>
      </div>
      <div className="penalty-controls">
        <div className="aim-controls" role="group" aria-label="Shot direction">
          {(["Left", "Center", "Right"] as const).map((direction) => (
            <button
              key={direction}
              aria-pressed={aim === direction}
              disabled={phase === "flight"}
              onClick={() => {
                setAim(direction);
                if (phase === "done") setPhase("ready");
              }}
            >
              <Target size={15} />
              {direction}
            </button>
          ))}
        </div>
        <label>
          Shot power
          <input
            type="range"
            min="35"
            max="100"
            value={power}
            disabled={phase === "flight"}
            onChange={(event) => {
              setPower(Number(event.target.value));
              if (phase === "done") setPhase("ready");
            }}
          />
          <output>{power}</output>
        </label>
        {phase === "done" ? (
          <button
            className="button button-lime"
            onClick={() => setPhase("ready")}
          >
            Next shot
            <ArrowUpRight size={16} />
          </button>
        ) : (
          <button
            className="button button-lime"
            disabled={phase === "flight"}
            onClick={shoot}
          >
            Shoot
            <ArrowUpRight size={16} />
          </button>
        )}
      </div>
      <p className="module-disclaimer">
        Independent local demonstration. The owner&apos;s separate 3D game, Penalty Kings, is a different project and is not used here. Keeper movement is deterministic;
        power above 90 sends the shot wide. Scores last only for this visit.
      </p>
    </div>
  );
}
