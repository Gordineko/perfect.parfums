const inactiveFill = "rgba(156, 163, 175, 0.5)";

export default function BasketCounterMinusIcon({ disabled = false }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden
    >
      <path
        d="M15 0V15H0V0H15ZM4.16699 6.66699C3.94598 6.66699 3.73343 6.75485 3.57715 6.91113C3.42107 7.06738 3.33301 7.27914 3.33301 7.5C3.33301 7.72086 3.42107 7.93262 3.57715 8.08887C3.73343 8.24515 3.94598 8.33301 4.16699 8.33301H10.833C11.054 8.33301 11.2666 8.24515 11.4229 8.08887C11.5789 7.93262 11.667 7.72086 11.667 7.5C11.667 7.27914 11.5789 7.06738 11.4229 6.91113C11.2666 6.75485 11.054 6.66699 10.833 6.66699H4.16699Z"
        fill={disabled ? inactiveFill : "#1A1A1A"}
      />
    </svg>
  );
}
