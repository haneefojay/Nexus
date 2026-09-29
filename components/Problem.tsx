"use client";

import { motion, MotionValue, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const fragments = [
  "SHEET_07_FINAL",
  "FIELD REPORT / 09:42",
  "ALERT 8291",
  "MAP LAYER 04",
  "MAINTENANCE LOG",
  "EMAIL: PUMP FAILURE",
  "SCADA / NORTH",
  "INSPECTION_291.pdf",
];

function FragmentPiece({
  fragment,
  index,
  spread,
}: {
  fragment: string;
  index: number;
  spread: MotionValue<number>;
}) {
  const x = useTransform(
    spread,
    [0, 1],
    [0, (index % 2 ? 1 : -1) * (70 + index * 21)],
  );
  const y = useTransform(spread, [0, 1], [0, (index - 3.5) * 34]);
  const rotate = useTransform(spread, [0, 1], [0, (index - 4) * 3.6]);

  return (
    <motion.div className="fragment" style={{ x, y, rotate }}>
      <span>0{index + 1}</span>
      {fragment}
    </motion.div>
  );
}

export function Problem() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const spread = useTransform(scrollYProgress, [0.15, 0.65], [1, 0]);

  return (
    <section ref={ref} className="problem-section">
      <div className="problem-copy">
        <span className="section-index">02 / THE VISIBILITY GAP</span>
        <h2>
          Your infrastructure is connected.
          <br />
          <span>Your tools aren&apos;t.</span>
        </h2>
        <p>
          The physical network is one system. Operational knowledge is scattered
          across maps, inboxes, spreadsheets, inspections, and disconnected software.
        </p>
      </div>
      <div className="fragment-field" aria-hidden="true">
        {fragments.map((fragment, index) => (
          <FragmentPiece
            key={fragment}
            fragment={fragment}
            index={index}
            spread={spread}
          />
        ))}
        <motion.div className="unified-core" style={{ scale: useTransform(spread, [1, 0], [0.7, 1]) }}>
          <i />
          NEXUS
          <small>ONE OPERATIONAL PICTURE</small>
        </motion.div>
      </div>
    </section>
  );
}
