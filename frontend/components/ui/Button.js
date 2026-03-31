import clsx from "clsx";

const variants = {
  primary:   "bg-primary hover:bg-opacity-90 text-white",
  accent:    "bg-accent hover:bg-accent-hover text-gray-900",
  outline:   "border border-primary text-primary hover:bg-primary hover:text-white",
  danger:    "bg-danger hover:bg-red-700 text-white",
  ghost:     "text-gray-600 hover:bg-gray-100",
};

const sizes = {
  sm:  "px-3 py-1.5 text-xs",
  md:  "px-4 py-2 text-sm",
  lg:  "px-6 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size    = "md",
  className,
  loading,
  disabled,
  ...rest
}) {
  return (
    <button
      className={clsx(
        "font-semibold rounded transition-colors duration-150 inline-flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        (disabled || loading) && "opacity-60 cursor-not-allowed",
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
        </svg>
      )}
      {children}
    </button>
  );
}
