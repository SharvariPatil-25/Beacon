import React, { useEffect, useState } from 'react'

// Minimal hash router: routes look like  #/app/compliance
export function useHash() {
  const read = () => (window.location.hash.replace(/^#/, '') || '/')
  const [path, setPath] = useState(read)
  useEffect(() => {
    const on = () => { setPath(read()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return path
}

export const go = (to) => { window.location.hash = to }

export function Link({ to, className = '', activeClass = '', exact = false, children, onClick, ...rest }) {
  const path = useHash()
  const on = exact ? path === to : path === to || (to !== '/app' && path.startsWith(to + '/'))
  return (
    <a href={`#${to}`} className={`${className} ${on ? activeClass : ''}`} onClick={onClick} {...rest}>
      {children}
    </a>
  )
}
