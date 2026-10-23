"use client";
import { useState } from "react";
import { CarFront, RotateCcw } from "lucide-react";
import SpatialView from "./spatial-view";
import LensSystems from "@/components/lens/lens-systems";
const initial = Array.from({ length: 24 }, (_, i) =>
  i % 7 === 0 ? "Reserved" : i % 3 === 0 ? "Occupied" : "Free",
);
export default function ParkingWorld() {
  const [slots, setSlots] = useState(initial),
    [selected, setSelected] = useState(1);
  const current = slots[selected];
  const [gate, setGate] = useState("");
  function arriveAtGate() {
    const free = slots.findIndex((status) => status === "Free");
    if (free < 0) {
      setGate(
        "Lot full: the gate allocates nothing and the car is turned away.",
      );
      return;
    }
    setSlots((items) =>
      items.map((item, i) => (i === free ? "Occupied" : item)),
    );
    setSelected(free);
    setGate(
      `Car allocated to bay A${String(free + 1).padStart(2, "0")}, the first free bay. Free bays fell by one.`,
    );
  }
  function change(status: "Free" | "Occupied" | "Reserved") {
    setSlots((items) =>
      items.map((item, i) => (i === selected ? status : item)),
    );
  }
  return (
    <div className="interactive-module parking-module">
      <div className="module-toolbar">
        <div>
          <span className="eyebrow">LEVEL 01 / ILLUSTRATIVE FLOOR PLAN</span>
          <p>Every state has a place. Select a bay to inspect it.</p>
        </div>
        <button
          className="button button-outline"
          onClick={() => {
            setSlots(initial);
            setSelected(1);
            setGate("");
          }}
        >
          <RotateCcw size={15} />
          Reset simulation
        </button>
      </div>
      <SpatialView
        kind="parking"
        selected={selected}
        onSelect={setSelected}
        slots={slots}
        fallback={
          <div className="parking-map-visual" aria-hidden="true">
            <div className="parking-map-road">
              ENTRY → <span>DEMO FLOOR</span> → EXIT
            </div>
            <div className="parking-map-grid">
              {slots.map((status, i) => (
                <div
                  key={i}
                  className={`parking-bay bay-${status.toLowerCase()} ${i === selected ? "selected" : ""}`}
                >
                  <span>A{String(i + 1).padStart(2, "0")}</span>
                  {status === "Occupied" ? (
                    <CarFront size={27} />
                  ) : (
                    <b>{status === "Reserved" ? "R" : "+"}</b>
                  )}
                  <small>{status}</small>
                </div>
              ))}
            </div>
          </div>
        }
      />
      <div className="parking-inspector-layout">
        <div
          className="parking-slot-controls"
          role="group"
          aria-label="Parking bays"
        >
          {slots.map((status, i) => (
            <button
              key={i}
              aria-pressed={selected === i}
              aria-label={`Bay A${String(i + 1).padStart(2, "0")} ${status}`}
              onClick={() => setSelected(i)}
              className={`slot-${status.toLowerCase()}`}
            >
              A{String(i + 1).padStart(2, "0")} <span>{status}</span>
            </button>
          ))}
        </div>
        <div className="parking-inspector">
          <span className="eyebrow">SELECTED BAY / SIMULATED</span>
          <h3>
            A{String(selected + 1).padStart(2, "0")} <span>{current}</span>
          </h3>
          <p>
            These local states illustrate a floor map. They do not query or
            update the project’s PostgreSQL database.
          </p>
          <div className="module-actions">
            <button
              className="button button-lime"
              disabled={current !== "Free"}
              onClick={() => change("Occupied")}
            >
              Simulate arrival
            </button>
            <button
              className="button button-outline"
              disabled={current === "Free"}
              onClick={() => change("Free")}
            >
              Release demo bay
            </button>
          </div>
          <button className="button button-outline" onClick={arriveAtGate}>
            Car arrives at the gate
          </button>
          <p role="status">{gate}</p>
          <p role="status">
            {slots.filter((status) => status === "Free").length} free ·{" "}
            {slots.filter((status) => status === "Occupied").length} occupied ·{" "}
            {slots.filter((status) => status === "Reserved").length} reserved
          </p>
        </div>
      </div>
      <section
        className="pk-concurrency"
        aria-labelledby="pk-concurrency-title"
      >
        <h3 id="pk-concurrency-title">When two cars arrive together</h3>
        <LensSystems />
      </section>
      <p className="module-disclaimer">
        Synthetic occupancy and local state only. The source supports an
        additional out-of-service state. Allocation row locks, billing, and
        permissions belong to the real database implementation, and billing
        comes from tariffs held in that database. None of it is simulated here.
      </p>
    </div>
  );
}
