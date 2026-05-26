"use client";

import { useId } from "react";

export default function ReviewUserAvatarIcon() {
  const clipId = useId();

  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <circle cx="20" cy="20" r="19" stroke="#11110F" strokeWidth="2" />
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M20.0004 20.2249C23.9561 20.2249 27.1629 17.0181 27.1629 13.0624C27.1629 9.10666 23.9561 5.8999 20.0004 5.8999C16.0447 5.8999 12.8379 9.10666 12.8379 13.0624C12.8379 17.0181 16.0447 20.2249 20.0004 20.2249Z"
          stroke="#11110F"
          strokeWidth="2"
          strokeMiterlimit="10"
        />
        <path
          d="M6.5 33L6.87476 30.6251C7.40998 28.2093 9.66525 25.0742 11.9313 23.5028C14.1973 21.9313 17.0523 21.071 20.0003 21.0713C22.9518 21.0719 25.8096 21.9351 28.0761 23.5106C30.3426 25.0861 33.2196 28.2055 33.7498 30.6251L34.2028 30.0384"
          stroke="#11110F"
          strokeWidth="2"
          strokeMiterlimit="10"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="30" height="30" fill="white" transform="translate(5 5)" />
        </clipPath>
      </defs>
    </svg>
  );
}
