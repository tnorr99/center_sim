import React from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'right' | 'left' | 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'right' }: TooltipProps) {
  return (
    <span className={`tooltip-wrap tooltip-${position}`}>
      {children}
      <span className="tooltip-popup">{content}</span>
    </span>
  );
}
