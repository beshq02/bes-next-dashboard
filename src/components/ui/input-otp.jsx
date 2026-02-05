"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Minus } from "lucide-react"
import { OTPInput, OTPInputContext } from "input-otp"

const InputOTP = React.forwardRef(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
    className={cn("justify-center items-center", className)}
    {...props} />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef(({ index, className, size = "default", ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  const sizeClasses = {
    default: "h-9 w-9 text-sm",
    lg: "flex-1 aspect-square min-w-0 font-semibold",
  }

  const sizeStyles = size === "lg" ? {
    height: 'clamp(60px, 18vw, 100px)',
    width: 'clamp(60px, 18vw, 100px)',
    fontSize: 'clamp(24px, 7vw, 48px)',
  } : {}

  return (
    (<div
      ref={ref}
      className={cn(
        "relative flex items-center justify-center border-y border-r border-input shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        sizeClasses[size] || sizeClasses.default,
        isActive && "z-10 ring-2 ring-ring",
        className
      )}
      style={sizeStyles}
      {...props}>
      {char}
      {hasFakeCaret && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
        </div>
      )}
    </div>)
  );
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
