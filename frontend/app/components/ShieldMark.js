// The signature element: a shield built from a hexagonal grid — reads as
// "verified perimeter" rather than a generic padlock. Pulses gently when
// `active` (used to indicate a live/verified state, e.g. after a
// successful gateway test call).
export function ShieldMark({ size = 28, active = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 2L28 7V15C28 22.5 22.8 27.7 16 30C9.2 27.7 4 22.5 4 15V7L16 2Z"
        stroke="#3ED6B5"
        strokeWidth="1.6"
        fill="rgba(62,214,181,0.06)"
      />
      <path
        d="M16 8L22 10.5V15.2C22 19 19.5 21.7 16 23C12.5 21.7 10 19 10 15.2V10.5L16 8Z"
        stroke="#3ED6B5"
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />
      {active && <circle cx="16" cy="15.5" r="2.2" fill="#3ED6B5">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
      </circle>}
    </svg>
  );
}
