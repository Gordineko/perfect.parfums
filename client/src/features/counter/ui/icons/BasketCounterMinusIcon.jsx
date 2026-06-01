const inactiveFill = "rgba(156, 163, 175, 0.5)";

export default function BasketCounterMinusIcon({ disabled = false }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M16.1719 10.8438C16.4048 10.8438 16.5938 10.6547 16.5938 10.4219C16.5938 10.189 16.4048 10 16.1719 10H8.71875H7.875H0.421875C0.189 10 0 10.189 0 10.4219C0 10.6547 0.189 10.8438 0.421875 10.8438H7.875H8.71875H16.1719Z"
        fill={disabled ? inactiveFill : "#11110F"}
      />
    </svg>
  );
}
