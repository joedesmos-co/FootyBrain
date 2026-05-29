/**
 * Centered empty / no-results panel with optional actions.
 * @param {{
 *   title?: string,
 *   children?: import('react').ReactNode,
 *   actions?: import('react').ReactNode,
 *   className?: string,
 *   labelledBy?: string,
 * }} props
 */
export default function EmptyState({ title, children, actions, className = '', id }) {
  return (
    <section
      id={id}
      className={`empty-state${className ? ` ${className}` : ''}`}
      aria-label={title && !children ? title : undefined}
    >
      {title ? <p className="empty-state__title">{title}</p> : null}
      {children}
      {actions ? <div className="empty-state__actions action-row action-row--center">{actions}</div> : null}
    </section>
  );
}
