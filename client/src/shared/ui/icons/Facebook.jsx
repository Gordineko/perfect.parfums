import { useId } from "react";

const Facebook = () => {
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
      <g clipPath={`url(#${clipId})`}>
        <circle cx="30" cy="30" r="30" fill="currentColor" />
        <path
          d="M20 0C8.95312 0 0 8.95312 0 20C0 31.0469 8.95312 40 20 40C31.0469 40 40 31.0469 40 20C40 8.95312 31.0469 0 20 0ZM24.4141 16.6094L24.1875 19.6016H21.1172V29.9922H17.2422V19.6016H15.1719V16.6094H17.2422V14.6016C17.2422 13.7187 17.2656 12.3516 17.9062 11.5C18.5859 10.6016 19.5156 9.99219 21.1172 9.99219C23.7266 9.99219 24.8203 10.3672 24.8203 10.3672L24.3047 13.4297C24.3047 13.4297 23.4453 13.1797 22.6406 13.1797C21.8359 13.1797 21.1172 13.4688 21.1172 14.2734V16.6094H24.4141Z"
          fill="var(--color-nude)"
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="40" height="40" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default Facebook;
