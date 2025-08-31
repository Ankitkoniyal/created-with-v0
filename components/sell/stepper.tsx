type StepperProps = {
  current: number // 1-based index
  total?: number
  className?: string
}

export function Stepper({ current, total = 4, className }: StepperProps) {
  const steps = Array.from({ length: total }, (_, i) => i + 1)
  return (
    <div className={["flex items-center justify-center gap-6", className].filter(Boolean).join(" ")}>
      {steps.map((n) => {
        const active = n === current
        return (
          <div
            key={n}
            aria-current={active ? "step" : undefined}
            className={[
              "h-9 w-9 rounded-full grid place-items-center text-sm font-medium",
              active ? "bg-green-700 text-white" : "bg-muted text-foreground/70",
              "ring-1 ring-black/10 dark:ring-white/10",
            ].join(" ")}
          >
            {n}
          </div>
        )
      })}
    </div>
  )
}
