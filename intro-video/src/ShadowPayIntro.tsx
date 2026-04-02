import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  interpolateColors,
} from 'remotion';

const COLORS = {
  background: '#0a0a0a',
  emerald: '#10b981',
  cyan: '#06b6d4',
  emeraldGlow: 'rgba(16, 185, 129, 0.6)',
  cyanGlow: 'rgba(6, 182, 212, 0.6)',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
};

const AnimatedBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const rotation = interpolate(frame, [0, 390], [0, 45]);
  const glowIntensity = 0.3 + Math.sin(frame * 0.02) * 0.1;

  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(
            ellipse 80% 50% at 50% 50%,
            rgba(16, 185, 129, ${glowIntensity * 0.15}) 0%,
            transparent 50%
          ),
          radial-gradient(
            ellipse 60% 40% at 30% 70%,
            rgba(6, 182, 212, ${glowIntensity * 0.1}) 0%,
            transparent 40%
          ),
          linear-gradient(
            ${rotation}deg,
            ${COLORS.background} 0%,
            #0f0f0f 50%,
            ${COLORS.background} 100%
          )
        `,
      }}
    />
  );
};

const Particles: React.FC = () => {
  const frame = useCurrentFrame();

  const particles = Array.from({ length: 15 }, (_, i) => {
    const baseX = (i * 137.5) % 100;
    const baseY = (i * 89.3) % 100;
    const size = 2 + (i % 3);
    const speed = 0.3 + (i % 4) * 0.1;
    const delay = i * 20;

    const y = baseY + Math.sin((frame + delay) * speed * 0.02) * 5;
    const opacity = interpolate(
      Math.sin((frame + delay) * 0.03),
      [-1, 1],
      [0.1, 0.4]
    );

    const color = i % 2 === 0 ? COLORS.emerald : COLORS.cyan;

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${baseX}%`,
          top: `${y}%`,
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          opacity,
          boxShadow: `0 0 ${size * 3}px ${color}`,
        }}
      />
    );
  });

  return <AbsoluteFill>{particles}</AbsoluteFill>;
};

const Logo: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleSpring = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });

  const scale = interpolate(scaleSpring, [0, 1], [0.3, 1]);

  const rotation = interpolate(
    spring({
      frame: frame - delay,
      fps,
      config: { damping: 20, stiffness: 80 },
    }),
    [0, 1],
    [-180, 0]
  );

  const glowSize = 30 + Math.sin((frame - delay) * 0.1) * 10;

  const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
      }}
    >
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: 28,
          background: `linear-gradient(135deg, ${COLORS.emerald} 0%, ${COLORS.cyan} 100%)`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: `
            0 0 ${glowSize}px ${COLORS.emeraldGlow},
            0 0 ${glowSize * 2}px ${COLORS.cyanGlow}
          `,
        }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
    </div>
  );
};

const GlowingTitle: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const letters = 'SHADOWPAY'.split('');

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
      {letters.map((letter, i) => {
        const letterDelay = delay + i * 3;

        const springValue = spring({
          frame: frame - letterDelay,
          fps,
          config: { damping: 15, stiffness: 150, mass: 0.5 },
        });

        const opacity = interpolate(springValue, [0, 1], [0, 1]);
        const translateY = interpolate(springValue, [0, 1], [40, 0]);
        const scale = interpolate(springValue, [0, 0.5, 1], [0.5, 1.2, 1]);

        const glowPhase = (frame - letterDelay) * 0.05 + i * 0.5;
        const glowIntensity = 0.6 + Math.sin(glowPhase) * 0.3;

        const color = interpolateColors(
          Math.sin(glowPhase),
          [-1, 1],
          [COLORS.emerald, COLORS.cyan]
        );

        return (
          <span
            key={i}
            style={{
              fontSize: 110,
              fontWeight: 900,
              fontFamily: 'Inter, system-ui, sans-serif',
              color: COLORS.textPrimary,
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
              textShadow: `
                0 0 10px ${color},
                0 0 20px ${color},
                0 0 40px rgba(16, 185, 129, ${glowIntensity * 0.5})
              `,
              letterSpacing: '0.02em',
            }}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
};

const Subtitle: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame - delay, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(
    spring({
      frame: frame - delay,
      fps,
      config: { damping: 20, stiffness: 100 },
    }),
    [0, 1],
    [30, 0]
  );

  const text = 'Private Payroll for Solana';
  const charsToShow = Math.min(
    text.length,
    Math.floor((frame - delay - 15) / 1.5)
  );
  const displayText = text.slice(0, Math.max(0, charsToShow));
  const showCursor = frame % 15 < 8 && charsToShow < text.length;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontSize: 36,
          fontWeight: 400,
          fontFamily: 'Inter, system-ui, sans-serif',
          color: COLORS.textSecondary,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        {displayText}
        {showCursor && <span style={{ color: COLORS.emerald }}>|</span>}
      </span>
    </div>
  );
};

const TechBadges: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badges = [
    { label: 'Bulletproofs', icon: '🛡️' },
    { label: 'Solana', icon: '◎' },
    { label: 'Compliant', icon: '✓' },
    { label: 'Zero Logging', icon: '🔒' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 24,
        flexWrap: 'wrap',
        maxWidth: 900,
      }}
    >
      {badges.map((badge, i) => {
        const badgeDelay = delay + i * 10;

        const springValue = spring({
          frame: frame - badgeDelay,
          fps,
          config: { damping: 15, stiffness: 120 },
        });

        const opacity = interpolate(springValue, [0, 1], [0, 1]);
        const scale = interpolate(springValue, [0, 0.8, 1], [0.5, 1.1, 1]);
        const translateY = interpolate(springValue, [0, 1], [20, 0]);

        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `scale(${scale}) translateY(${translateY}px)`,
              padding: '14px 28px',
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ fontSize: 24 }}>{badge.icon}</span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: COLORS.textSecondary,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {badge.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const ScanLines: React.FC = () => {
  const frame = useCurrentFrame();
  const scanPosition = (frame * 3) % 1200;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.02 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.1) 2px,
            rgba(255, 255, 255, 0.1) 4px
          )`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: scanPosition,
          height: 2,
          background: `linear-gradient(
            90deg,
            transparent 0%,
            ${COLORS.emerald} 50%,
            transparent 100%
          )`,
          opacity: 0.4,
        }}
      />
    </AbsoluteFill>
  );
};

export const ShadowPayIntro: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <AnimatedBackground />
      <Particles />

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 50,
        }}
      >
        <Sequence from={0}>
          <Logo delay={15} />
        </Sequence>

        <Sequence from={60}>
          <GlowingTitle delay={0} />
        </Sequence>

        <Sequence from={120}>
          <Subtitle delay={0} />
        </Sequence>

        <Sequence from={210}>
          <TechBadges delay={0} />
        </Sequence>
      </AbsoluteFill>

      <ScanLines />

      <AbsoluteFill
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 40%,
            rgba(0, 0, 0, 0.5) 100%
          )`,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
