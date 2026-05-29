/**
 * Consistent section title — uppercase label on profiles, sentence case on content pages.
 * @param {{
 *   id?: string,
 *   children: import('react').ReactNode,
 *   variant?: 'label' | 'title',
 *   className?: string,
 *   as?: 'h2' | 'h3',
 * }} props
 */
export default function SectionHeading({
  id,
  children,
  variant = 'title',
  className = '',
  as: Tag = 'h2',
}) {
  return (
    <Tag
      id={id}
      className={`section-heading section-heading--${variant}${className ? ` ${className}` : ''}`}
    >
      {children}
    </Tag>
  );
}
