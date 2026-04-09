import React from 'react';

/**
 * Full-viewport animated mist for landing, auth, loading, and main app.
 * Palette is driven by `--ambient-*` variables (per theme on documentElement).
 */
export default function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden>
      <div className="ambient-bg-base" />
      <div className="ambient-bg-breathe" />
      <div className="ambient-bg-orb ambient-bg-orb--1" />
      <div className="ambient-bg-orb ambient-bg-orb--2" />
      <div className="ambient-bg-orb ambient-bg-orb--3" />
      <div className="ambient-bg-orb ambient-bg-orb--4" />
      <div className="ambient-bg-veil" />
    </div>
  );
}
