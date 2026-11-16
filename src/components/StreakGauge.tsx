import React from 'react';
import {
  STREAK_STAGES,
  STREAK_COLORS,
  StreakMultiplier,
  clampStreak,
  streakStageIndex,
  formatStreakMult,
  streakStyle,
} from '../utils/groupStreak';

interface StreakGaugeProps {
  multiplier: number;
  flash?: 'up' | 'down' | null;
  className?: string;
}

const CX = 60;
const CY = 64;
const R = 50;
const SEGMENTS = STREAK_STAGES.length;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(rad),
    y: CY - radius * Math.sin(rad),
  };
}

/** Upper semicircle, left (180°) to right (0°), clockwise. */
function arcPath(fromDeg: number, toDeg: number, radius: number): string {
  const a = polar(fromDeg, radius);
  const b = polar(toDeg, radius);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

const SEG_SWEEP = 180 / SEGMENTS;

function midAngle(stage: number): number {
  return 180 - (stage + 0.5) * SEG_SWEEP;
}

export const StreakGauge: React.FC<StreakGaugeProps> = ({
  multiplier,
  flash = null,
  className = '',
}) => {
  const stage = clampStreak(multiplier) as StreakMultiplier;
  const index = streakStageIndex(stage);
  const color = streakStyle(stage);
  const isMax = stage === 4;
  const needleAngle = midAngle(index);
  // Needle is drawn pointing up (90°); rotate so it points at needleAngle.
  const rotate = 90 - needleAngle;

  return (
    <div
      className={`relative shrink-0 leading-none ${className || 'w-[68px]'} ${
        flash === 'down' ? 'motion-safe:animate-shake' : ''
      } ${isMax ? 'animate-streak-max' : ''}`}
      title={`Streak ×${formatStreakMult(stage)}`}
      aria-label={`Streak ×${formatStreakMult(stage)}`}
      role="img"
    >
      <svg
        viewBox="0 0 120 78"
        className="w-full h-auto overflow-visible"
        aria-hidden="true"
      >
        {/* Muted track */}
        <path
          d={arcPath(180, 0, R)}
          fill="none"
          stroke="#1e293b"
          strokeWidth="11"
          strokeLinecap="butt"
        />
        {STREAK_STAGES.map((s, i) => {
          const from = 180 - i * SEG_SWEEP;
          const to = 180 - (i + 1) * SEG_SWEEP;
          const active = i === index;
          return (
            <path
              key={s}
              d={arcPath(from, to, R)}
              fill="none"
              stroke={STREAK_COLORS[s].fill}
              strokeWidth={active ? 12 : 9}
              strokeLinecap="butt"
              opacity={active ? 1 : 0.55}
            />
          );
        })}
        {/* Pivot */}
        <circle cx={CX} cy={CY} r="4.5" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1.5" />
        {/* Needle */}
        <g
          style={{
            transform: `rotate(${rotate}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transformBox: 'view-box',
            transition: 'transform 0.4s ease-out',
          }}
        >
          <polygon
            points={`${CX - 2.6},${CY + 3} ${CX + 2.6},${CY + 3} ${CX},${CY - 30}`}
            fill="#f8fafc"
            stroke="#0f172a"
            strokeWidth="1"
          />
        </g>
        <circle cx={CX} cy={CY} r="3" fill={color.fill} stroke="#0f172a" strokeWidth="1" />
        {/* Multiplier */}
        <text
          x={CX}
          y={50}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color.fill}
          fontSize="18"
          fontWeight="900"
          stroke={color.stroke}
          strokeWidth="3"
          paintOrder="stroke"
          style={{ fontFamily: 'inherit' }}
        >
          {`x${formatStreakMult(stage)}`}
        </text>
      </svg>
      {flash === 'down' && (
        <span className="pointer-events-none absolute inset-0 rounded-full bg-rose-500/20" aria-hidden="true" />
      )}
    </div>
  );
};
