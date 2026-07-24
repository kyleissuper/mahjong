import {
  AbsoluteFill,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { Tile } from "./Tile.tsx";
import { calculateScore, getRuleReference } from "../calculate-score.ts";
import type { Meld, Win } from "../types.ts";

const RULE_LABELS: Record<string, string> = Object.fromEntries(
  getRuleReference().map((r) => [r.name, r.label]),
);

const WIN: Win = {
  players: ["A", "B", "C", "D"],
  winner: "A",
  method: "discard",
  from: "B",
  dealer: "C",
  dealerRounds: 1,
  special: [],
};

const MELDS_V1: Meld[] = [
  { type: "chow", tiles: ["2b", "3b", "4b"], concealed: false },
  { type: "pong", tiles: ["Rd", "Rd", "Rd"], concealed: false },
  { type: "chow", tiles: ["5b", "6b", "7b"], concealed: true },
  { type: "chow", tiles: ["2d", "3d", "4d"], concealed: true },
  { type: "pair", tiles: ["8b", "8b"], concealed: true, winTile: "8b" },
];

const MELDS_V2: Meld[] = [
  { type: "chow", tiles: ["2b", "3b", "4b"], concealed: false },
  { type: "pong", tiles: ["Rd", "Rd", "Rd"], concealed: false },
  { type: "chow", tiles: ["5b", "6b", "7b"], concealed: true },
  { type: "chow", tiles: ["2b", "3b", "4b"], concealed: true },
  { type: "pair", tiles: ["8b", "8b"], concealed: true, winTile: "8b" },
];

const SCORE_V1 = calculateScore({ melds: MELDS_V1 }, WIN);
const SCORE_V2 = calculateScore({ melds: MELDS_V2 }, WIN);
const SORTED_V1 = [...SCORE_V1.appliedRules].sort(
  (a, b) => b.points - a.points,
);
const SORTED_V2 = [...SCORE_V2.appliedRules].sort(
  (a, b) => b.points - a.points,
);

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

// --- Timeline ---
// Phase 1: tiles animate in (0-75)
// Phase 2: button appears, cursor clicks (75-155)
// Phase 3: score v1 reveals (150-240)
// Phase 4: cursor clicks tiles to swap 2d,3d,4d -> 2b,3b,4b (240-330)
//   - score disappears at 240
//   - cursor moves to 2d at 250, clicks 260 -> becomes 2b
//   - cursor moves to 3d at 275, clicks 285 -> becomes 3b
//   - cursor moves to 4d at 300, clicks 310 -> becomes 4b
// Phase 5: button + click again (330-410)
// Phase 6: score v2 reveals (410+)

const SWAP_MELD_INDEX = 3; // index into concealed melds (2d,3d,4d)
const SWAP_TILES_BEFORE = ["2d", "3d", "4d"];
const SWAP_TILES_AFTER = ["2b", "3b", "4b"];

// Absolute frame numbers for each tile swap
const SWAP_START = 240;
const TILE_SWAP_FRAMES = [260, 285, 310]; // frame each tile flips

// --- Components ---

function AnimatedTile({
  tile,
  enterIndex,
}: {
  tile: string;
  enterIndex: number;
}) {
  const frame = useCurrentFrame();
  const start = enterIndex * 3;
  const progress = interpolate(frame, [start, start + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
      }}
    >
      <Tile tile={tile} size={90} />
    </div>
  );
}

function SwappableTile({
  tileBefore,
  tileAfter,
  enterIndex,
  swapFrame,
}: {
  tileBefore: string;
  tileAfter: string;
  enterIndex: number;
  swapFrame: number;
}) {
  const frame = useCurrentFrame();

  // Enter animation
  const enterStart = enterIndex * 3;
  const enterProgress = interpolate(
    frame,
    [enterStart, enterStart + 12],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_OUT,
    },
  );

  // Swap animation: flip out old, flip in new
  const swapProgress = interpolate(frame, [swapFrame, swapFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  const isSwapped = frame >= swapFrame + 5;
  const currentTile = isSwapped ? tileAfter : tileBefore;
  const scaleX = isSwapped
    ? interpolate(swapProgress, [0.5, 1], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : interpolate(swapProgress, [0, 0.5], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  return (
    <div
      style={{
        opacity: enterProgress,
        transform: `translateY(${interpolate(enterProgress, [0, 1], [30, 0])}px) scaleX(${scaleX})`,
      }}
    >
      <Tile tile={currentTile} size={90} />
    </div>
  );
}

function HandDisplay() {
  const frame = useCurrentFrame();

  const exposedMelds = [
    { tiles: ["2b", "3b", "4b"], concealed: false },
    { tiles: ["Rd", "Rd", "Rd"], concealed: false },
  ];
  const concealedMelds = [
    { tiles: ["5b", "6b", "7b"], concealed: true },
    { tiles: SWAP_TILES_BEFORE, concealed: true, swappable: true },
    { tiles: ["8b", "8b"], concealed: true },
  ];

  const exposedCount = exposedMelds.reduce((s, m) => s + m.tiles.length, 0);
  const dividerDelay = exposedCount * 3;
  const concealedLabelDelay = dividerDelay + 5;
  const dividerProgress = interpolate(
    frame,
    [dividerDelay, dividerDelay + 20],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_OUT,
    },
  );

  let tileIdx = 0;

  function renderMeld(
    meld: { tiles: string[]; swappable?: boolean },
    startIdx: number,
  ) {
    return (
      <div style={{ display: "flex", gap: 6 }}>
        {meld.tiles.map((t, j) => {
          const idx = startIdx + j;
          if (meld.swappable) {
            return (
              <SwappableTile
                key={j}
                tileBefore={SWAP_TILES_BEFORE[j]}
                tileAfter={SWAP_TILES_AFTER[j]}
                enterIndex={idx}
                swapFrame={TILE_SWAP_FRAMES[j]}
              />
            );
          }
          return <AnimatedTile key={j} tile={t} enterIndex={idx} />;
        })}
      </div>
    );
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 40 }}>
      {/* Exposed */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            opacity: interpolate(frame, [0, 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASE_OUT,
            }),
          }}
        >
          Exposed
        </span>
        <div style={{ display: "flex", gap: 32 }}>
          {exposedMelds.map((m, i) => {
            const start = tileIdx;
            tileIdx += m.tiles.length;
            return <div key={i}>{renderMeld(m, start)}</div>;
          })}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 2,
          background: "rgba(255,255,255,0.25)",
          opacity: dividerProgress,
          transform: `scaleX(${dividerProgress})`,
          transformOrigin: "left",
        }}
      />

      {/* Concealed */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            opacity: interpolate(
              frame,
              [concealedLabelDelay, concealedLabelDelay + 15],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: EASE_OUT,
              },
            ),
          }}
        >
          Concealed
        </span>
        <div style={{ display: "flex", gap: 32 }}>
          {concealedMelds.map((m, i) => {
            const start = tileIdx;
            tileIdx += m.tiles.length;
            return <div key={i}>{renderMeld(m, start)}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

function Cursor({ x, y, opacity }: { x: number; y: number; opacity: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        pointerEvents: "none" as const,
        zIndex: 100,
      }}
    >
      <Img src={staticFile("cursor.png")} width={70} height={100} />
    </div>
  );
}

function ScoreButton({ clickFrame }: { clickFrame: number }) {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  const pressDepth = interpolate(frame, [clickFrame, clickFrame + 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const releaseDepth = interpolate(
    frame,
    [clickFrame + 3, clickFrame + 8],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: EASE_OUT,
    },
  );
  const depth = frame < clickFrame + 3 ? pressDepth : releaseDepth;
  const shadowY = interpolate(depth, [0, 1], [6, 1]);
  const btnY = interpolate(depth, [0, 1], [0, 5]);

  const fadeOut = interpolate(
    frame,
    [clickFrame + 10, clickFrame + 25],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div style={{ opacity: fadeIn * fadeOut }}>
      <div style={{ transform: `translateY(${btnY}px)` }}>
        <div
          style={{
            padding: "20px 48px",
            borderRadius: 16,
            background: "linear-gradient(to bottom, #65d4b3, #4aab90)",
            boxShadow: `0 ${shadowY}px 0 #3a8a73, 0 ${shadowY + 4}px 12px rgba(0,0,0,0.3)`,
            color: "#fff",
            fontSize: 42,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Score Hand →
        </div>
      </div>
    </div>
  );
}

function ScoreReveal({
  score,
  sortedRules,
  fadeOutAt,
}: {
  score: typeof SCORE_V1;
  sortedRules: typeof SORTED_V1;
  fadeOutAt?: number;
}) {
  const frame = useCurrentFrame();

  const headerProgress = interpolate(frame, [0, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  const fadeOut =
    fadeOutAt != null
      ? interpolate(frame, [fadeOutAt, fadeOutAt + 15], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          opacity: headerProgress,
          transform: `translateY(${interpolate(headerProgress, [0, 1], [30, 0])}px)`,
        }}
      >
        <span style={{ fontSize: 80, fontWeight: 800, color: "#fff" }}>
          {score.handValue}
        </span>
        <span
          style={{
            fontSize: 48,
            fontWeight: 500,
            color: "rgba(255,255,255,0.5)",
            marginLeft: 12,
          }}
        >
          pts
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minWidth: 500,
        }}
      >
        {sortedRules.map(({ name, points }, i) => {
          const ruleProgress = interpolate(
            frame,
            [15 + i * 10, 35 + i * 10],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EASE_OUT,
            },
          );
          return (
            <div
              key={name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 60,
                opacity: ruleProgress,
                transform: `translateX(${interpolate(ruleProgress, [0, 1], [30, 0])}px)`,
              }}
            >
              <span style={{ fontSize: 36, color: "rgba(255,255,255,0.7)" }}>
                {RULE_LABELS[name] ?? name}
              </span>
              <span style={{ fontSize: 36, fontWeight: 700, color: "#5bc5a7" }}>
                +{points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Phase 1: cursor moves to score button and clicks
function Phase1Cursor() {
  const frame = useCurrentFrame();
  // Button is at absolute left 1260, vertically centered (~540)
  const btnX = 1360;
  const btnY = 560;

  const cursorX = interpolate(frame, [10, 35], [btnX + 120, btnX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  const cursorY = interpolate(frame, [10, 35], [btnY + 80, btnY], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });

  const fadeIn = interpolate(frame, [10, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [50, 65], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return <Cursor x={cursorX} y={cursorY} opacity={fadeIn * fadeOut} />;
}

// Phase 2: cursor clicks 3 tiles then moves to score button — one continuous motion
const BTN_X = 1360;
const BTN_Y = 560;
const PHASE2_BTN_CLICK = 100; // relative frame within Phase2Cursor for button click

function Phase2Cursor() {
  const frame = useCurrentFrame();

  const tileWidth = 120;
  const meldGap = 32;
  const firstSwapTileX = 3 * tileWidth + meldGap;
  const tileY = 660;

  // 4 targets: 3 tiles + score button
  const targets = [
    ...([0, 1, 2] as const).map((i) => ({
      x: 120 + firstSwapTileX + i * tileWidth + 50,
      y: tileY,
      clickFrame: TILE_SWAP_FRAMES[i] - SWAP_START,
    })),
    {
      x: BTN_X,
      y: BTN_Y,
      clickFrame: PHASE2_BTN_CLICK,
    },
  ];

  const startX = 2000;
  const startY = tileY;

  let cursorX = startX;
  let cursorY = startY;

  for (let i = 0; i < targets.length; i++) {
    const prevX = i === 0 ? startX : targets[i - 1].x;
    const prevY = i === 0 ? startY : targets[i - 1].y;
    const moveBegin = i === 0 ? 0 : targets[i - 1].clickFrame + 5;
    const moveEnd = targets[i].clickFrame - 2;

    if (frame >= moveBegin) {
      const t = interpolate(frame, [moveBegin, moveEnd], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: EASE_OUT,
      });
      cursorX = interpolate(t, [0, 1], [prevX, targets[i].x]);
      cursorY = interpolate(t, [0, 1], [prevY, targets[i].y]);
    }
  }

  const lastClick = targets[3].clickFrame;
  const fadeOut = interpolate(frame, [lastClick + 10, lastClick + 25], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return <Cursor x={cursorX} y={cursorY} opacity={fadeOut} />;
}

export function ScoringDemo() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Tiles — always visible, handles its own enter + swap animations */}
      <Sequence name="Hand" layout="none">
        <div
          style={{
            position: "absolute",
            left: 120,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <HandDisplay />
        </div>
      </Sequence>

      {/* Phase 1: Score button (click at frame 38 relative) */}
      <Sequence
        name="ScoreButton1"
        from={75}
        durationInFrames={80}
        layout="none"
      >
        <div
          style={{
            position: "absolute",
            left: 1260,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <ScoreButton clickFrame={38} />
        </div>
      </Sequence>

      {/* Phase 1: Cursor */}
      <Sequence
        name="Phase1Cursor"
        from={75}
        durationInFrames={80}
        layout="none"
      >
        <Phase1Cursor />
      </Sequence>

      {/* Phase 1: Score v1 reveal, fades out before swap */}
      <Sequence name="ScoreV1" from={150} durationInFrames={110} layout="none">
        <div
          style={{
            position: "absolute",
            left: 1260,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <ScoreReveal
            score={SCORE_V1}
            sortedRules={SORTED_V1}
            fadeOutAt={75}
          />
        </div>
      </Sequence>

      {/* Phase 2: Unified cursor — clicks 3 tiles then score button */}
      <Sequence
        name="Phase2Cursor"
        from={SWAP_START}
        durationInFrames={140}
        layout="none"
      >
        <Phase2Cursor />
      </Sequence>

      {/* Phase 2: Score button (click at PHASE2_BTN_CLICK relative to SWAP_START) */}
      <Sequence
        name="ScoreButton2"
        from={SWAP_START + PHASE2_BTN_CLICK - 20}
        durationInFrames={80}
        layout="none"
      >
        <div
          style={{
            position: "absolute",
            left: 1260,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <ScoreButton clickFrame={20} />
        </div>
      </Sequence>

      {/* Phase 2: Score v2 reveal */}
      <Sequence
        name="ScoreV2"
        from={SWAP_START + PHASE2_BTN_CLICK + 15}
        layout="none"
      >
        <div
          style={{
            position: "absolute",
            left: 1260,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <ScoreReveal score={SCORE_V2} sortedRules={SORTED_V2} />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
}
