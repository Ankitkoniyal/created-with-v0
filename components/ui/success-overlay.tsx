"use client"

type Props = {
  open: boolean
  title?: string
  message?: string
  onClose?: () => void
  actionLabel?: string
}

export function SuccessOverlay({ open, title = "Success", message, onClose, actionLabel = "Continue" }: Props) {
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose?.()
      }}
      tabIndex={-1}
    >
      <div className="w-full max-w-lg rounded-xl bg-white p-10 text-center shadow-2xl">
        <h2 className="text-3xl font-semibold text-green-700">{title}</h2>
        {message ? <p className="mt-4 text-base text-foreground/80">{message}</p> : null}
        <button
          onClick={onClose}
          className="mt-7 inline-flex items-center justify-center rounded-md bg-green-700 px-6 py-3 text-white text-sm font-medium hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
