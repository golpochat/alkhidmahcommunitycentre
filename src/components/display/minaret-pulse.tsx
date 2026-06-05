export function MinaretPulse() {
  return (
    <div className="display-minaret-pulse" aria-hidden="true">
      <svg
        className="display-minaret-icon"
        viewBox="0 0 64 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="display-minaret-body"
          d="M32 8 L38 20 L38 72 L44 72 L44 80 L20 80 L20 72 L26 72 L26 20 Z"
          fill="currentColor"
        />
        <circle className="display-minaret-crescent" cx="32" cy="12" r="4" fill="currentColor" />
        <rect x="30" y="4" width="4" height="8" fill="currentColor" />
      </svg>
    </div>
  );
}
