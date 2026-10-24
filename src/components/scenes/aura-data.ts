/**
 * The parts of AURA shown in the studio scene, taken from its README and
 * ARCHITECTURE.md: four studio zones and a companion in the web layer, a typed
 * bridge, and Swift services behind a router. Positions are only for drawing.
 */
export type AuraPartId =
  | "hardware"
  | "software"
  | "ailab"
  | "github-zone"
  | "companion"
  | "bridge"
  | "router"
  | "github"
  | "ai"
  | "store";

export type AuraPart = {
  id: AuraPartId;
  label: string;
  layer: "web" | "bridge" | "native";
  text: string;
  /** Service a request from this part is routed to, for the illustration. */
  service?: "github" | "ai" | "store";
  at: [number, number, number];
};

export const DECK_Y = 1.6;
export const NATIVE_Y = -1.3;

export const auraParts: AuraPart[] = [
  {
    id: "hardware",
    label: "Hardware lab",
    layer: "web",
    text: "One of the four studio zones the README lists. Everything you see in it is drawn by the React and three.js web layer.",
    service: "store",
    at: [-2.3, DECK_Y, -2.3],
  },
  {
    id: "software",
    label: "Software studio",
    layer: "web",
    text: "A studio zone for software work. It shows project data, which lives behind the bridge rather than in the web view.",
    service: "store",
    at: [2.3, DECK_Y, -2.3],
  },
  {
    id: "ailab",
    label: "AI lab",
    layer: "web",
    text: "The zone for the AI companion's work. Requests go to a provider-neutral AI service in Swift. The README says this is still mocked.",
    service: "ai",
    at: [-2.3, DECK_Y, 2.3],
  },
  {
    id: "github-zone",
    label: "GitHub projects",
    layer: "web",
    text: "Shows the owner's repositories. The web layer never sees the token; it asks the native GitHub service over the bridge.",
    service: "github",
    at: [2.3, DECK_Y, 2.3],
  },
  {
    id: "companion",
    label: "AI companion",
    layer: "web",
    text: "The companion at the centre of the studio. In AURA it is backed by the AI and voice services; here it is only a shape.",
    service: "ai",
    at: [0, DECK_Y + 1.2, 0],
  },
  {
    id: "bridge",
    label: "Typed bridge",
    layer: "bridge",
    text: "Versioned JSON contracts written in TypeScript and decoded by both the web client and Swift tests. It is the only way between the two layers.",
    at: [0, (DECK_Y + NATIVE_Y) / 2, 0],
  },
  {
    id: "router",
    label: "Bridge router",
    layer: "native",
    text: "A Swift router that receives each bridge message and dispatches it to the right service.",
    at: [0, NATIVE_Y, 0],
  },
  {
    id: "github",
    label: "GitHub service",
    layer: "native",
    text: "Read-only GitHub App access with device-flow sign-in. The token is kept in the macOS Keychain.",
    at: [2.6, NATIVE_Y, 1.2],
  },
  {
    id: "ai",
    label: "AI and voice",
    layer: "native",
    text: "A provider-neutral AI service with a mock and an OpenAI-compatible adapter, plus on-device speech frameworks.",
    at: [-2.6, NATIVE_Y, 1.2],
  },
  {
    id: "store",
    label: "SQLite store",
    layer: "native",
    text: "Local persistence for preferences and project data.",
    at: [0, NATIVE_Y, -2.7],
  },
];

export const auraPart = (id: AuraPartId) =>
  auraParts.find((part) => part.id === id)!;

/** The hops a request takes from a part to its service and back. */
export function requestRoute(id: AuraPartId): AuraPartId[] {
  const part = auraPart(id);
  if (!part.service) return [];
  return [id, "bridge", "router", part.service, "router", "bridge", id];
}

export const hopText: Record<string, string> = {
  out: "sends a typed, versioned request",
  bridge: "the bridge checks the contract and passes it to Swift",
  router: "the router dispatches it to one service",
  github: "reads from GitHub with the Keychain token, read-only",
  ai: "answers from the AI service (mocked in AURA today)",
  store: "reads local data from SQLite",
  back: "the reply comes back over the same bridge",
};
