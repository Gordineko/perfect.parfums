const StarDecor = ({ className, color = "currentColor" }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M10 0.5L7.39194 7.22236L0.5 7.75921L5.78271 12.4509L4.12909 19.5L10 15.672M10 0.5L12.6081 7.22236L19.5 7.75921L14.2173 12.4509L15.8709 19.5L10 15.672"
        fill={color}
      />
      <path
        d="M10 0.5L7.39194 7.22236L0.5 7.75921L5.78271 12.4509L4.12909 19.5L10 15.672L15.8709 19.5L14.2173 12.4509L19.5 7.75921L12.6081 7.22236L10 0.5Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default StarDecor;
