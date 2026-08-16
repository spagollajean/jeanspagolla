export default function Logo({ href, withBadge = false, className = '', style }) {
  const content = (
    <>
      <span className="brand-logo__word">
        Ren<em>ascer</em>
      </span>
      {withBadge && <span className="viora-badge-logo">VIORA</span>}
    </>
  );

  const classes = `brand-logo${className ? ` ${className}` : ''}`;

  if (href) {
    return (
      <a href={href} className={classes} style={style}>
        {content}
      </a>
    );
  }

  return (
    <div className={classes} style={style}>
      {content}
    </div>
  );
}
