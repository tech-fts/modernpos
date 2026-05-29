import React from 'react'
import Link from 'next/link'
import { ResponsiveButton, type ResponsiveButtonProps } from './ResponsiveButton'

export interface ResponsiveLinkButtonProps extends Omit<ResponsiveButtonProps, 'onClick'> {
  href: string
  external?: boolean
  as?: React.ComponentType<{ href: string; children: React.ReactNode }>
}

export const ResponsiveLinkButton: React.FC<ResponsiveLinkButtonProps> = ({
  href,
  external = false,
  as: Component = Link,
  children,
  ...buttonProps
}) => {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
      >
        <ResponsiveButton {...buttonProps}>
          {children}
        </ResponsiveButton>
      </a>
    )
  }

  return (
    <Component href={href}>
      <ResponsiveButton {...buttonProps}>
        {children}
      </ResponsiveButton>
    </Component>
  )
}

export default ResponsiveLinkButton
