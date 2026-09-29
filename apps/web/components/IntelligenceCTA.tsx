"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const flow = [
  ["01", "Physical asset", "Panel / tower / pump"],
  ["02", "Inspection", "Response / evidence"],
  ["03", "NEXUS", "Spatial operating model"],
  ["04", "Attention", "Finding / due date / priority"],
  ["05", "Action", "Assign / verify / report"],
];

export function IntelligenceCTA() {
  return (
    <>
      <section className="intelligence-section">
        <div className="intelligence-heading">
          <span className="section-index">08 / CONTINUOUS INTELLIGENCE</span>
          <h2>
            The physical world,
            <br />
            <em>translated into decisions.</em>
          </h2>
        </div>
        <div className="intelligence-flow">
          {flow.map((item, index) => (
            <motion.div
              key={item[1]}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.55 }}
              className={index === 2 ? "nexus-step" : ""}
            >
              <span>{item[0]}</span>
              <strong>{item[1]}</strong>
              <small>{item[2]}</small>
              {index < flow.length - 1 && <ArrowRight aria-hidden="true" />}
            </motion.div>
          ))}
          <motion.i
            className="flow-signal"
            animate={{ left: ["2%", "96%"] }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </section>
      <section id="contact" className="final-cta">
        <div className="cta-orbit" aria-hidden="true">
          <i />
          <i />
          <i />
          <span className="orbit-node n1" />
          <span className="orbit-node n2" />
          <span className="orbit-node n3" />
        </div>
        <div className="final-copy">
          <span className="section-index">09 / BUILD THE PICTURE</span>
          <h2>
            Make your
            <br />
            infrastructure <em>visible.</em>
          </h2>
          <p>
            Build a living operational picture of every asset, every location, and every issue that
            matters.
          </p>
          <a href="mailto:access@nexus.systems" className="primary-button">
            Explore NEXUS <ArrowUpRight />
          </a>
        </div>
      </section>
      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-mark">
            <i />
            <i />
          </span>
          <strong>NEXUS</strong>
          <p>Infrastructure, made visible.</p>
        </div>
        <div className="footer-links">
          <div>
            <span>PLATFORM</span>
            <a href="#product">Product</a>
            <a href="#network">Network</a>
            <a href="#demo">Demo</a>
          </div>
          <div>
            <span>COMPANY</span>
            <a href="#top">About</a>
            <a href="#top">Careers</a>
            <a href="#top">Contact</a>
          </div>
          <div>
            <span>SYSTEM</span>
            <a href="#top">Security</a>
            <a href="#top">Status</a>
            <a href="#top">Privacy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 NEXUS SYSTEMS</span>
          <span>35° 34&apos; 12.8&quot; N / ALWAYS ON</span>
        </div>
      </footer>
    </>
  );
}
