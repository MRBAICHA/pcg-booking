export default function PcgLogo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 520 340"
      className={className}
      aria-label="PCG"
    >
      <rect x="6" y="6" width="508" height="328" rx="52" ry="52" fill="#1B3464" stroke="white" strokeWidth="10" />
      <text x="260" y="243" fontFamily="'Arial Black', 'Arial', sans-serif" fontWeight="900" fontSize="196" fill="white" textAnchor="middle" letterSpacing="-4">PCG</text>
    </svg>
  );
}
