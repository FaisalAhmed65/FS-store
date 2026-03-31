export default function LoadingSpinner({ size = "md" }) {
  const sz = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" }[size] || "w-8 h-8";
  return (
    <div
      className={`${sz} border-4 border-gray-200 border-t-primary rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}
