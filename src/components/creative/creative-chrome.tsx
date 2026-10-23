"use client";
import Link from "next/link";
import { type RefObject } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowUp, ArrowUpRight, Asterisk, Menu, X } from "lucide-react";
import { profile } from "@/data/profile";
import ModeSwitcher from "../mode";

type NavItem = { id: string; name: string };

/**
 * Creative navigation: a floating sticker dock instead of a full-width bar.
 * It carries the same links and anchors as the Professional header.
 */
export function CreativeHeader({
  navigation,
  pathname,
  active,
  menu,
  setMenu,
  buttonRef,
}: {
  navigation: NavItem[];
  pathname: string;
  active: string;
  menu: boolean;
  setMenu: (open: boolean) => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  const current = (id: string) =>
    pathname.startsWith("/projects/")
      ? id === "projects"
        ? "page"
        : undefined
      : active === id
        ? "location"
        : undefined;
  return (
    <header className="c-header">
      <div className="container c-header-row">
        <Link href="/" className="c-brand" aria-label="form&function. — Home">
          <span className="c-brand-mark" aria-hidden="true">
            <Asterisk size={20} strokeWidth={2.6} />
          </span>
          <span className="c-brand-word">
            form<i>&</i>function.
          </span>
        </Link>
        <nav className="c-dock" aria-label="Main navigation">
          {navigation.map((link, i) => (
            <Link
              key={link.id}
              href={`/#${link.id}`}
              aria-current={current(link.id)}
            >
              <sup className="mono" aria-hidden="true">
                {i + 1}
              </sup>
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="c-actions">
          <ModeSwitcher />
          <Link href="/#contact" className="c-hi">
            Say hi
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <button
            ref={buttonRef}
            type="button"
            className="c-menu-toggle"
            aria-expanded={menu}
            aria-controls="mobile-navigation"
            aria-label={menu ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {menu && (
          <m.nav
            id="mobile-navigation"
            className="c-sheet"
            aria-label="Mobile navigation"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {navigation.map((link, i) => (
              <Link
                key={link.id}
                href={`/#${link.id}`}
                onClick={() => setMenu(false)}
              >
                <span className="mono">0{i + 1}</span>
                {link.name}
                <ArrowUpRight size={20} aria-hidden="true" />
              </Link>
            ))}
          </m.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/** Creative footer: a colophon sheet, not the Professional two-row footer. */
export function CreativeFooter() {
  const github = profile.socials.find((s) => s.name === "GitHub")?.url;
  return (
    <footer className="c-footer">
      <div className="container">
        <div className="c-footer-card">
          <p className="c-footer-big">
            Thanks for <em>stopping by.</em>
          </p>
          <div className="c-footer-links">
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="c-chip c-chip-lime"
              >
                {profile.email}
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            )}
            {github && (
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="c-chip c-chip-sky"
              >
                GitHub / EXCALIBUR303
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            )}
            <a href="#main" className="c-chip c-chip-pink">
              Back to the desk
              <ArrowUp size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
        <p className="c-footer-fine mono">
          <span>
            © {new Date().getFullYear()} {profile.name.toUpperCase()}
          </span>
          <span>FORM &amp; FUNCTION — CREATIVE MODE</span>
        </p>
      </div>
    </footer>
  );
}
