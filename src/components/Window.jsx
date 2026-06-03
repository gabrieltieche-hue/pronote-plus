export function Window({ children, className = '', ...props }) {
  return (
    <section className={`window ${className}`} {...props}>
      {children}
    </section>
  )
}

export function WindowHeader({ children, className = '', ...props }) {
  return (
    <div className={`window-header ${className}`} {...props}>
      {typeof children === 'string' ? <h2>{children}</h2> : children}
    </div>
  )
}

export function WindowContent({ children, className = '', ...props }) {
  return (
    <div className={`window-content ${className}`} {...props}>
      {children}
    </div>
  )
}
