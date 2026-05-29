/**
 * Horizontal (or stacked) row of CTAs — shared spacing and mobile wrap.
 * @param {{ children: import('react').ReactNode, stack?: boolean, className?: string }} props
 */
export default function ActionRow({ children, stack = false, className = '' }) {
  return (
    <div
      className={`action-row${stack ? ' action-row--stack' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  );
}
