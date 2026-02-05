import React from 'react';
import type { ReactNode } from 'react';
import './ice-stage.css';

type StageLayoutProps = {
  backgroundSrc: string;
  frameSrc: string;
  hudSrc: string;
  children: ReactNode;
};

export function StageLayout({ backgroundSrc, frameSrc, hudSrc, children }: StageLayoutProps) {
  return (
    <div className="ice-stage">
      <div
        className="ice-stage__bg"
        style={{ backgroundImage: `url(${backgroundSrc})` }}
        aria-hidden="true"
      />
      <div className="ice-stage__snow ice-stage__snow--back" aria-hidden="true" />
      <div className="ice-stage__snow ice-stage__snow--front" aria-hidden="true" />
      <img className="ice-stage__frame" src={frameSrc} alt="" aria-hidden="true" />
      <img className="ice-stage__hud" src={hudSrc} alt="" aria-hidden="true" />
      <div className="ice-stage__content">{children}</div>
    </div>
  );
}
