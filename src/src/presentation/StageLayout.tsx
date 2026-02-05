import React from 'react';
import type { ReactNode } from 'react';
import './ice-stage.css';

type StageLayoutProps = {
  backgroundSrc: string;
  frameSrc: string;
  hudSrc: string;
  hudOverlay?: ReactNode;
  frameWidth?: number;
  frameHeight?: number;
  mazeBounds?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  children: ReactNode;
};

export function StageLayout({
  backgroundSrc,
  frameSrc,
  hudSrc,
  hudOverlay,
  frameWidth,
  frameHeight,
  mazeBounds,
  children,
}: StageLayoutProps) {
  const hasFrameMetrics =
    typeof frameWidth === 'number' &&
    typeof frameHeight === 'number' &&
    frameWidth > 0 &&
    frameHeight > 0;

  const mazeStyle = hasFrameMetrics && mazeBounds
    ? ({
        ['--maze-left' as const]: `${((mazeBounds.left + mazeBounds.width / 2) / frameWidth) * 100}%`,
        ['--maze-top' as const]: `${((mazeBounds.top + mazeBounds.height / 2) / frameHeight) * 100}%`,
        ['--maze-width' as const]: `${(mazeBounds.width / frameWidth) * 100}%`,
        ['--maze-height' as const]: `${(mazeBounds.height / frameHeight) * 100}%`,
      } as React.CSSProperties)
    : undefined;

  return (
    <div className="ice-stage">
      <div
        className="ice-stage__bg"
        style={{ backgroundImage: `url(${backgroundSrc})` }}
        aria-hidden="true"
      />
      <div className="ice-stage__snow ice-stage__snow--back" aria-hidden="true" />
      <div className="ice-stage__snow ice-stage__snow--front" aria-hidden="true" />
      <div
        className="ice-stage__frame-wrap"
        style={hasFrameMetrics ? { aspectRatio: `${frameWidth} / ${frameHeight}` } : undefined}
      >
        <img className="ice-stage__frame" src={frameSrc} alt="" aria-hidden="true" />
        <img className="ice-stage__hud" src={hudSrc} alt="" aria-hidden="true" />
        {hudOverlay && <div className="ice-stage__hud-overlay">{hudOverlay}</div>}
        <div className="ice-stage__maze-slot" style={mazeStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}
