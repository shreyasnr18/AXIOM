import React, { memo } from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

export const AnimatedTokenEdge: React.FC<EdgeProps> = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const tokenType = data?.tokenType || 'currency';
  const speed = data?.speed || 2;
  const isCurrency = tokenType === 'currency';

  return (
    <>
      {/* Background glow path */}
      <path
        id={`${id}-glow`}
        className="react-flow__edge-path"
        d={edgePath}
        stroke={isCurrency ? 'rgba(0, 242, 254, 0.2)' : 'rgba(139, 92, 246, 0.2)'}
        strokeWidth={5}
        fill="none"
      />

      {/* Primary SVG path */}
      <path
        id={id}
        style={style}
        className="react-flow__edge-path stroke-slate-700"
        d={edgePath}
        markerEnd={markerEnd}
        strokeWidth={2}
        fill="none"
      />

      {/* Framer Motion animated particle / token */}
      <circle r="4" fill={isCurrency ? '#00F2FE' : '#A78BFA'}>
        <animateMotion
          dur={`${Math.max(1, 3.5 / speed)}s`}
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>

      {/* Second particle with offset for flowing particle stream feel */}
      <circle r="3" fill={isCurrency ? '#10B981' : '#38BDF8'} opacity="0.8">
        <animateMotion
          dur={`${Math.max(1, 3.5 / speed)}s`}
          begin="0.75s"
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>

      {/* Edge mid-label badge */}
      <foreignObject
        width={34}
        height={22}
        x={labelX - 17}
        y={labelY - 11}
        className="pointer-events-none"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="w-full h-full flex items-center justify-center">
          <span
            className={`text-[9px] font-mono font-black px-1 py-0.5 rounded-full border shadow-sm ${
              isCurrency
                ? 'bg-slate-950/90 text-axiom-accent border-axiom-accent/40'
                : 'bg-slate-950/90 text-purple-400 border-purple-500/40'
            }`}
          >
            {isCurrency ? '₹' : '⚡'}
          </span>
        </div>
      </foreignObject>
    </>
  );
});
