"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CircleGauge, RadioTower, Route, Wrench } from "lucide-react";
import { reveal } from "@/lib/motion";

const capabilities = [
  {
    id: "01",
    title: "Asset intelligence",
    headline: "Every asset. One operational picture.",
    copy: "A continuously updated record of condition, context, ownership, and history.",
    icon: CircleGauge,
    visual: "asset",
  },
  {
    id: "02",
    title: "Spatial operations",
    headline: "Understand where problems actually happen.",
    copy: "Place every signal in its geographic and operational context.",
    icon: RadioTower,
    visual: "spatial",
  },
  {
    id: "03",
    title: "Predictive maintenance",
    headline: "Move from reaction to informed action.",
    copy: "Watch condition change, understand risk, and intervene at the right moment.",
    icon: Wrench,
    visual: "maintenance",
  },
  {
    id: "04",
    title: "Field coordination",
    headline: "Send the right team to the right place.",
    copy: "Connect priority, location, expertise, and route in one operational flow.",
    icon: Route,
    visual: "field",
  },
];

function CapabilityVisual({ type }: { type: string }) {
  if (type === "asset") {
    return (
      <div className="asset-stack">
        {[0, 1, 2, 3].map((item) => (
          <motion.div key={item} whileHover={{ x: 12 }} className={item === 1 ? "attention" : ""}>
            <span>NX-{6814 + item}</span>
            <small>{item === 1 ? "Attention" : "Operational"}</small>
            <i />
          </motion.div>
        ))}
      </div>
    );
  }
  if (type === "spatial") {
    return (
      <div className="spatial-rings">
        <i />
        <i />
        <i />
        <span>ZONE 07</span>
        <b />
      </div>
    );
  }
  if (type === "maintenance") {
    return (
      <div className="condition-track">
        <span>HEALTHY</span>
        <div>
          <i />
          <i />
          <i />
          <i />
        </div>
        <span>INTERVENTION</span>
        <motion.b
          animate={{ left: ["4%", "68%", "52%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    );
  }
  return (
    <div className="route-visual">
      <svg viewBox="0 0 500 220">
        <path d="M32 176 C130 185 120 52 236 90 S340 38 464 46" />
      </svg>
      <i className="team">T-04</i>
      <i className="destination">NX-3490</i>
    </div>
  );
}

export function Capabilities() {
  return (
    <section id="product" className="capabilities">
      <div className="section-heading">
        <span className="section-index">04 / CAPABILITIES</span>
        <h2>
          Physical systems,
          <br />
          made legible.
        </h2>
      </div>
      <div className="capability-list">
        {capabilities.map((item) => {
          const Icon = item.icon;
          return (
            <motion.article
              key={item.id}
              className="capability"
              variants={reveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
            >
              <div className="capability-meta">
                <span>{item.id}</span>
                <Icon aria-hidden="true" />
                <small>{item.title}</small>
              </div>
              <div className="capability-copy">
                <h3>{item.headline}</h3>
                <p>{item.copy}</p>
                <button aria-label={`Learn about ${item.title}`}>
                  Inspect capability <ArrowUpRight />
                </button>
              </div>
              <div className={`capability-visual ${item.visual}`}>
                <CapabilityVisual type={item.visual} />
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
