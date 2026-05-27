import { useId } from "react";

const inactiveFill = "rgba(156, 163, 175, 0.5)";

export default function BasketCounterPlusIcon({ disabled = false }) {
  const clipId = useId().replace(/:/g, "");
  const fill = disabled ? inactiveFill : "#11110F";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M16.875 8.57812H9.42188V1.125C9.42188 0.892125 9.23287 0.703125 9 0.703125C8.76713 0.703125 8.57812 0.892125 8.57812 1.125V8.57812H1.125C0.892125 8.57812 0.703125 8.76713 0.703125 9C0.703125 9.23287 0.892125 9.42188 1.125 9.42188H8.57812V16.875C8.57812 17.1079 8.76713 17.2969 9 17.2969C9.23287 17.2969 9.42188 17.1079 9.42188 16.875V9.42188H16.875C17.1079 9.42188 17.2969 9.23287 17.2969 9C17.2969 8.76713 17.1079 8.57812 16.875 8.57812Z"
          fill={fill}
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="18" height="18" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
