'use client'

import { HTMLMotionProps, motion } from 'framer-motion'
import { forwardRef, ReactNode } from 'react'

// Типы для компонентов motion
export type MotionDivProps = HTMLMotionProps<'div'> & {
  children?: ReactNode
}

// Обертки для motion компонентов
export const MotionDiv = forwardRef<HTMLDivElement, MotionDivProps>((props, ref) => (
  <motion.div ref={ref} {...props} />
))
MotionDiv.displayName = 'MotionDiv'

export const MotionHeading = motion.h2
export const MotionSpan = motion.span
export const MotionHeader = motion.header
export const MotionNav = motion.nav 