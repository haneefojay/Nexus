"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Factory, RadioTower, Sun, Waves } from "lucide-react";
import { useRef } from "react";

const cases = [
  { name: "Energy", detail: "Solar farms / substations / distributed energy", icon: Sun },
  { name: "Telecom", detail: "Towers / equipment / field infrastructure", icon: RadioTower },
  { name: "Water", detail: "Pumps / treatment / distribution networks", icon: Waves },
  { name: "Industrial", detail: "Factories / equipment / remote facilities", icon: Factory },
];

export function ScaleUseCases() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 16]);

  return (
    <>
      <section ref={ref} className="scale-section">
        <div className="scale-copy">
          <span className="section-index">06 / SYSTEM SCALE</span>
          <h2>
            One network.
            <br />
            Thousands of assets.
            <br />
            <em>Zero blind spots.</em>
          </h2>
          <div className="scale-metrics">
            <div>
              <strong>ONE</strong>
              <span>asset register</span>
            </div>
            <div>
              <strong>FULL</strong>
              <span>inspection history</span>
            </div>
            <div>
              <strong>TRACE</strong>
              <span>evidence to action</span>
            </div>
          </div>
        </div>
        <motion.div className="node-cloud" style={{ rotate }}>
          {Array.from({ length: 132 }, (_, index) => (
            <motion.i
              key={index}
              style={{
                left: `${2 + ((index * 37) % 96)}%`,
                top: `${3 + ((index * 61) % 94)}%`,
                width: index % 17 === 0 ? 8 : 3,
                height: index % 17 === 0 ? 8 : 3,
              }}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: index % 5 === 0 ? 1 : 0.45, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (index % 20) * 0.025, duration: 0.4 }}
            />
          ))}
          <svg viewBox="0 0 800 800" aria-hidden="true">
            <circle cx="400" cy="400" r="250" />
            <circle cx="400" cy="400" r="160" />
            <path d="M80 510 C210 220 350 650 720 260" />
          </svg>
        </motion.div>
      </section>
      <section id="use-cases" className="use-cases">
        <div className="use-cases-heading">
          <span className="section-index">07 / INFRASTRUCTURE, ANYWHERE</span>
          <h2>
            The same operational truth,
            <br />
            across every physical system.
          </h2>
        </div>
        <div className="use-case-track">
          {cases.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.name}
                whileHover={{ x: 10 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              >
                <span>0{index + 1}</span>
                <Icon />
                <h3>{item.name}</h3>
                <p>{item.detail}</p>
                <div className="use-case-signal">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>
    </>
  );
}
