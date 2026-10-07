type QuantityStepperProps = {
  quantity: number;
  min?: number;
  disabled?: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  className?: string;
};

/** Quantity stepper for a cart line; the whole control locks while an update is pending. */
export function QuantityStepper({
  quantity,
  min = 1,
  disabled = false,
  onDecrease,
  onIncrease,
  className = "",
}: QuantityStepperProps) {
  const buttonClasses =
    "flex h-9 w-9 items-center justify-center text-lg font-semibold leading-none text-[color:var(--ink)] transition-colors hover:bg-[color:var(--bg)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--accent)]";

  return (
    <div
      role="group"
      aria-label="Quantity"
      className={"inline-flex items-center overflow-hidden rounded-lg border border-[color:var(--line)] bg-white " + className}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || quantity <= min}
        aria-label="Decrease quantity"
        className={buttonClasses}
      >
        <span aria-hidden="true">−</span>
      </button>
      <span className="w-10 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        aria-label="Increase quantity"
        className={buttonClasses}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
