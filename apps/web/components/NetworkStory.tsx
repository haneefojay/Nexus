"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { AlertTriangle, Check, Radio, Route } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stages = [
  {
    label: "See every asset.",
    copy: "Bring every site, tower, panel, pump, and facility into one spatial model.",
  },
  {
    label: "Understand every connection.",
    copy: "See upstream dependencies and the operational impact of a single failure.",
  },
  {
    label: "Detect what needs attention.",
    copy: "Surface weak signals before they become expensive field incidents.",
  },
  {
    label: "Coordinate the response.",
    copy: "Give field teams context, priority, and a direct route to resolution.",
  },
];

const mapNodes = Array.from({ length: 42 }, (_, index) => ({
  left: `${8 + ((index * 19) % 84)}%`,
  top: `${10 + ((index * 37) % 78)}%`,
  risk: index % 13 === 0,
  hub: index % 9 === 0,
}));

export function NetworkStory() {
  const ref = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const lineProgress = useTransform(scrollYProgress, [0.08, 0.92], ["0%", "100%"]);

  useEffect(
    () =>
      scrollYProgress.on("change", (value) => {
        setStage(Math.min(3, Math.floor(value * 4)));
      }),
    [scrollYProgress],
  );

  return (
    <section ref={ref} id="network" className="network-story">
      <div className="network-sticky">
        <div className="network-panel">
          <div className="panel-topline">
            <span>NEXUS NETWORK / MODEL</span>
            <span className="live-status">
              <i /> SYSTEM NOMINAL
            </span>
          </div>
          <div className={`map-stage stage-${stage}`}>
            <div className="topography topo-a" />
            <div className="topography topo-b" />
            <svg className="connection-layer" viewBox="0 0 1000 700" aria-hidden="true">
              <path d="M60 520 C250 340 320 600 505 330 S800 120 945 255" />
              <path d="M100 210 C260 120 300 350 460 240 S730 450 920 390" />
              <path d="M210 630 C370 490 610 620 790 510" />
            </svg>
            {mapNodes.map((node, index) => (
              <motion.span
                key={index}
                className={`map-node ${node.risk ? "risk" : ""} ${node.hub ? "hub" : ""}`}
                style={{ left: node.left, top: node.top }}
                animate={{
                  opacity: stage === 0 && index > 24 ? 0.1 : 1,
                  scale: stage === 2 && node.risk ? [1, 1.8, 1] : 1,
                }}
                transition={{
                  duration: 0.7,
                  repeat: stage === 2 && node.risk ? Infinity : 0,
                  repeatDelay: 0.8,
                }}
              />
            ))}
            <div className="map-coordinates">35° 34&apos; 12.8&quot; N / ZONE 04</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={stage}
                className="stage-card"
                initial={{ opacity: 0, x: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -12, filter: "blur(6px)" }}
              >
                {stage === 0 && <Radio />}
                {stage === 1 && <Route />}
                {stage === 2 && <AlertTriangle />}
                {stage === 3 && <Check />}
                <span>0{stage + 1}</span>
                <strong>{stages[stage].label}</strong>
                <p>{stages[stage].copy}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="story-progress">
          <motion.span style={{ height: lineProgress }} />
          {stages.map((item, index) => (
            <button
              key={item.label}
              className={stage === index ? "active" : ""}
              onClick={() => setStage(index)}
              aria-label={`Show stage: ${item.label}`}
            >
              0{index + 1}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
