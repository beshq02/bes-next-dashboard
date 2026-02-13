/**
 * Timeline primitives — adapted from timDeHof/shadcn-timeline
 * @see https://github.com/timDeHof/shadcn-timeline
 */
import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'

// ─── Timeline (ol wrapper) ────────────────────────────────────

const timelineVariants = cva('flex flex-col relative', {
  variants: {
    size: {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    },
  },
  defaultVariants: { size: 'md' },
})

const Timeline = React.forwardRef(({ className, size, children, ...props }, ref) => (
  <ol
    ref={ref}
    aria-label="Timeline"
    className={cn(timelineVariants({ size }), className)}
    {...props}
  >
    {children}
  </ol>
))
Timeline.displayName = 'Timeline'

// ─── TimelineItem (li) ───────────────────────────────────────

const TimelineItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <li ref={ref} className={cn('relative w-full', className)} {...props}>
    {children}
  </li>
))
TimelineItem.displayName = 'TimelineItem'

// ─── TimelineIcon (circular dot with icon) ───────────────────

const iconSizeMap = { sm: 'size-8', md: 'size-10', lg: 'size-12' }
const innerSizeMap = { sm: 'size-4', md: 'size-5', lg: 'size-6' }

const iconColorMap = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  muted: 'bg-muted text-muted-foreground',
  accent: 'bg-accent text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
}

function TimelineIcon({ icon, color = 'primary', iconSize = 'md', className }) {
  return (
    <div
      className={cn(
        'relative z-10 flex items-center justify-center rounded-full ring-8 ring-background shadow-sm',
        iconSizeMap[iconSize],
        iconColorMap[color],
        className,
      )}
    >
      {icon ? (
        <div className={cn('flex items-center justify-center', innerSizeMap[iconSize])}>
          {icon}
        </div>
      ) : (
        <div className={cn('rounded-full', innerSizeMap[iconSize])} />
      )}
    </div>
  )
}

// ─── TimelineConnector (vertical line) ───────────────────────

const connectorColorMap = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  muted: 'bg-muted',
  accent: 'bg-accent',
}

const TimelineConnector = React.forwardRef(
  ({ className, status = 'completed', color, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'w-0.5',
        color
          ? connectorColorMap[color]
          : {
              'bg-primary': status === 'completed',
              'bg-muted': status === 'pending',
              'bg-gradient-to-b from-primary to-muted': status === 'in-progress',
            },
        className,
      )}
      {...props}
    />
  ),
)
TimelineConnector.displayName = 'TimelineConnector'

// ─── TimelineHeader ──────────────────────────────────────────

const TimelineHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center gap-2', className)} {...props} />
))
TimelineHeader.displayName = 'TimelineHeader'

// ─── TimelineTitle ───────────────────────────────────────────

const TimelineTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight text-secondary-foreground', className)}
    {...props}
  >
    {children}
  </h3>
))
TimelineTitle.displayName = 'TimelineTitle'

// ─── TimelineDescription ────────────────────────────────────

const TimelineDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
TimelineDescription.displayName = 'TimelineDescription'

// ─── TimelineContent ────────────────────────────────────────

const TimelineContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1', className)} {...props} />
))
TimelineContent.displayName = 'TimelineContent'

// ─── TimelineTime ───────────────────────────────────────────

const TimelineTime = React.forwardRef(({ className, children, ...props }, ref) => (
  <time
    ref={ref}
    className={cn('text-sm font-medium tracking-tight text-muted-foreground', className)}
    {...props}
  >
    {children}
  </time>
))
TimelineTime.displayName = 'TimelineTime'

export {
  Timeline,
  TimelineItem,
  TimelineIcon,
  TimelineConnector,
  TimelineHeader,
  TimelineTitle,
  TimelineDescription,
  TimelineContent,
  TimelineTime,
}
