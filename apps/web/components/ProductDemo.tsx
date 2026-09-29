"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  LocateFixed,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Status = "All" | "Operational" | "Attention" | "Maintenance";

const demoNodes = Array.from({ length: 34 }, (_, index) => ({
  id: `NX-${3910 + index}`,
  x: 8 + ((index * 29) % 86),
  y: 12 + ((index * 43) % 74),
  status:
    index % 11 === 0
      ? ("Attention" as const)
      : index % 7 === 0
        ? ("Maintenance" as const)
        : ("Operational" as const),
}));

export function ProductDemo() {
  const [status, setStatus] = useState<Status>("All");
  const [selected, setSelected] = useState(demoNodes[11]);
  const visibleNodes = useMemo(
    () => demoNodes.filter((node) => status === "All" || node.status === status),
    [status],
  );

  return (
    <section id="platform" className="demo-section">
      <div className="demo-intro">
        <span className="section-index">05 / ENTER THE PLATFORM</span>
        <h2>
          A command center
          <br />
          for the physical world.
        </h2>
        <p>
          Explore an illustrative operating picture. Filter the network, inspect an asset, and move
          from inspection to action without losing context.
        </p>
      </div>
      <motion.div
        id="demo"
        className="product-shell"
        initial={{ opacity: 0, y: 50, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="shell-header">
          <div className="shell-brand">
            <span className="brand-mark">
              <i />
              <i />
            </span>
            NEXUS / <b>OPERATIONS</b>
          </div>
          <div className="shell-search">
            <Search />
            Search assets, regions, teams…
          </div>
          <div className="operator">
            OP <i />
          </div>
        </header>
        <aside className="shell-sidebar" aria-label="Product navigation">
          <button className="active">
            <Activity />
            <span>Network</span>
          </button>
          <button>
            <LocateFixed />
            <span>Regions</span>
          </button>
          <button>
            <AlertTriangle />
            <span>Attention</span>
          </button>
          <button>
            <SlidersHorizontal />
            <span>Controls</span>
          </button>
        </aside>
        <main className="shell-main">
          <div className="metrics">
            <div>
              <small>ASSETS</small>
              <strong>1,284</strong>
              <span>illustrative dataset</span>
            </div>
            <div>
              <small>ATTENTION REQUIRED</small>
              <strong className="warning">17</strong>
              <span>illustrative dataset</span>
            </div>
            <div>
              <small>MAINTENANCE</small>
              <strong>06</strong>
              <span>illustrative dataset</span>
            </div>
            <div>
              <small>OPERATIONAL</small>
              <strong>98.7%</strong>
              <span>illustrative dataset</span>
            </div>
          </div>
          <div className="demo-map">
            <div className="map-toolbar">
              {(["All", "Operational", "Attention", "Maintenance"] as Status[]).map((item) => (
                <button
                  key={item}
                  className={status === item ? "active" : ""}
                  onClick={() => setStatus(item)}
                >
                  {item}
                </button>
              ))}
              <button className="region-filter">
                All regions <ChevronDown />
              </button>
            </div>
            <div className="demo-contours" />
            <svg viewBox="0 0 1000 520" className="demo-lines" aria-hidden="true">
              <path d="M20 420 C180 260 260 460 390 270 S700 80 960 190" />
              <path d="M70 120 C280 80 350 290 510 160 S780 400 960 330" />
              <path d="M190 490 C420 380 560 500 850 410" />
            </svg>
            <AnimatePresence>
              {visibleNodes.map((node) => (
                <motion.button
                  key={node.id}
                  className={`demo-node ${node.status.toLowerCase()}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.75 }}
                  onClick={() => setSelected(node)}
                  aria-label={`Inspect ${node.id}, ${node.status}`}
                />
              ))}
            </AnimatePresence>
            <div className="map-legend">
              <span>
                <i className="operational" /> Operational
              </span>
              <span>
                <i className="attention" /> Attention
              </span>
              <span>
                <i className="maintenance" /> Maintenance
              </span>
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.aside
              key={selected.id}
              className="asset-drawer"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
            >
              <button className="drawer-close" aria-label="Close asset panel">
                <X />
              </button>
              <small>SELECTED ASSET</small>
              <h3>{selected.id}</h3>
              <div className={`asset-state ${selected.status.toLowerCase()}`}>
                <i /> {selected.status}
              </div>
              <dl>
                <div>
                  <dt>Type</dt>
                  <dd>Power relay</dd>
                </div>
                <div>
                  <dt>Region</dt>
                  <dd>West corridor</dd>
                </div>
                <div>
                  <dt>Last inspection</dt>
                  <dd>18 Sep 2026</dd>
                </div>
                <div>
                  <dt>Condition</dt>
                  <dd>No open finding</dd>
                </div>
              </dl>
              <div className="signal-chart">
                <svg viewBox="0 0 320 90">
                  <path d="M0 72 C30 62 38 76 62 48 S105 30 130 52 S170 65 195 34 S248 15 320 28" />
                </svg>
              </div>
              <button className="inspect-button">Open full asset record</button>
            </motion.aside>
          </AnimatePresence>
        </main>
      </motion.div>
    </section>
  );
}
