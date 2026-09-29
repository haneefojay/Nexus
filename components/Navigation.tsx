"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";

const links = ["Product", "Platform", "Use Cases", "Resources"];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  const background = useTransform(
    scrollY,
    [0, 100],
    ["rgba(7,10,9,0)", "rgba(7,10,9,.86)"],
  );

  return (
    <motion.header style={{ background }} className="site-nav">
      <a href="#top" className="brand" aria-label="NEXUS home">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
        </span>
        NEXUS
      </a>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map((link) => (
          <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`}>
            {link}
          </a>
        ))}
      </nav>
      <div className="nav-actions">
        <a className="sign-in" href="#demo">
          Sign in
        </a>
        <a className="request-access" href="#contact">
          Request access <ArrowUpRight size={15} />
        </a>
      </div>
      <button
        className="menu-button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {links.map((link, index) => (
              <motion.a
                key={link}
                href={`#${link.toLowerCase().replace(" ", "-")}`}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.06 }}
              >
                <span>0{index + 1}</span>
                {link}
              </motion.a>
            ))}
            <a className="mobile-access" href="#contact" onClick={() => setOpen(false)}>
              Request access <ArrowUpRight />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
