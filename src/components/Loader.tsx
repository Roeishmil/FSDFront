import { FC } from "react";

const Loader: FC = () => {
  return (
    <svg width="24" height="24" stroke="#000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <g style={{ transformOrigin: "center", animation: "rotate 2s linear infinite" }}>
        <circle
          cx="12"
          cy="12"
          r="9.5"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ animation: "dash 1.5s ease-in-out infinite" }}
        />
      </g>
      <style>
        {`
          @keyframes rotate {
            100% { transform: rotate(360deg); }
          }
          @keyframes dash {
            0% { stroke-dasharray: 0 150; stroke-dashoffset: 0; }
            47.5% { stroke-dasharray: 42 150; stroke-dashoffset: -16; }
            95%, 100% { stroke-dasharray: 42 150; stroke-dashoffset: -59; }
          }
        `}
      </style>
    </svg>
  );
};

export default Loader;
