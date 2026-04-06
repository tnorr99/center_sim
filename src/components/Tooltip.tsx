import React, { useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'right' | 'left' | 'top' | 'bottom';
}

const POPUP_W = 280;
const GAP = 10;

export function Tooltip({ content, children, position = 'right' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const wrapRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    let top = rect.top;
    let left = rect.left;

    if (position === 'right')  { left = rect.right + GAP; }
    if (position === 'left')   { left = rect.left - POPUP_W - GAP; }
    if (position === 'top')    { top = rect.top - GAP; left = rect.left + rect.width / 2 - POPUP_W / 2; }
    if (position === 'bottom') { top = rect.bottom + GAP; left = rect.left + rect.width / 2 - POPUP_W / 2; }

    // Clamp to viewport edges
    top  = Math.max(8, top);
    left = Math.min(window.innerWidth - POPUP_W - 8, Math.max(8, left));

    setCoords({ top, left });
    setVisible(true);
  }, [position]);

  const handleMouseLeave = useCallback(() => setVisible(false), []);

  return (
    <span
      ref={wrapRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'inline-block' }}
    >
      {children}
      {visible && ReactDOM.createPortal(
        <div className="tooltip-portal" style={{ top: coords.top, left: coords.left }}>
          {content}
        </div>,
        document.body
      )}
    </span>
  );
}
