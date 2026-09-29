"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { ease, stagger } from "@/lib/motion";

const NetworkScene = dynamic(() => import("./NetworkScene").then((module) => module.NetworkScene), {
  ssr: false,
  loading: () => <div className="scene-loader">Mapping network…</div>,
});

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.78], [1, 0]);

  return (
    <section id="top" ref={ref} className="hero">
      <motion.div style={{ y, opacity }} className="hero-scene-wrap">
        <NetworkScene />
      </motion.div>
      <motion.div className="hero-copy" variants={stagger} initial="hidden" animate="visible">
        <motion.div
          className="eyebrow"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
          }}
        >
          <span />
          Infrastructure operations / Overview
        </motion.div>
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 50 },
            visible: { opacity: 1, y: 0, transition: { duration: 1, ease } },
          }}
        >
          See the infrastructure
          <br />
          behind <em>everything.</em>
        </motion.h1>
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 26 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
          }}
        >
          One living, visual system for every asset, every location, and every operational signal.
        </motion.p>
        <motion.div
          className="hero-actions"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
          }}
        >
          <a href="#network" className="primary-button">
            Explore the network <ArrowUpRight />
          </a>
          <a href="#platform" className="text-button">
            See how it works <ArrowDown />
          </a>
        </motion.div>
      </motion.div>
      <div className="hero-rail">
        <span>01 / SYSTEM VIEW</span>
        <span>SCROLL TO TRACE THE SIGNAL</span>
      </div>
    </section>
  );
}
