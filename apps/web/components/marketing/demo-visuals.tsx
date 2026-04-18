"use client";

import dynamic from "next/dynamic";

// Lazy-load qrcode.react so the package (~15 KB gzipped) isn't pulled into
// the homepage entry chunk — it's only needed when the QR demo cycles in.
const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: 140,
          height: 140,
          background: "rgba(99, 102, 241, 0.08)",
          borderRadius: 8,
        }}
        aria-hidden="true"
      />
    ),
  }
);

interface DemoProps {
  className?: string;
}

export function QRCodeDemo({ className }: DemoProps): React.ReactElement {
  return (
    <div
      className={className}
      style={{ display: "flex", justifyContent: "center" }}
    >
      <QRCodeSVG
        value="https://utils.live"
        size={140}
        fgColor="#6366F1"
        bgColor="transparent"
      />
    </div>
  );
}

export function MermaidDemo({ className }: DemoProps): React.ReactElement {
  return (
    <div className={className} style={{ width: "100%", maxWidth: 420 }}>
      <svg
        viewBox="0 0 400 80"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Flowchart: Input to Process to Output"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#6366F1" />
          </marker>
        </defs>

        {/* Input node */}
        <rect
          x="10"
          y="15"
          width="90"
          height="50"
          rx="10"
          ry="10"
          fill="#EEF2FF"
          stroke="#6366F1"
          strokeWidth="2"
        />
        <text
          x="55"
          y="45"
          textAnchor="middle"
          fill="#1e1b4b"
          fontSize="14"
          fontFamily="system-ui, sans-serif"
        >
          Input
        </text>

        {/* Arrow 1 */}
        <line
          x1="100"
          y1="40"
          x2="145"
          y2="40"
          stroke="#6366F1"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />

        {/* Process node */}
        <rect
          x="155"
          y="15"
          width="90"
          height="50"
          rx="10"
          ry="10"
          fill="#EEF2FF"
          stroke="#6366F1"
          strokeWidth="2"
        />
        <text
          x="200"
          y="45"
          textAnchor="middle"
          fill="#1e1b4b"
          fontSize="14"
          fontFamily="system-ui, sans-serif"
        >
          Process
        </text>

        {/* Arrow 2 */}
        <line
          x1="245"
          y1="40"
          x2="290"
          y2="40"
          stroke="#6366F1"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />

        {/* Output node */}
        <rect
          x="300"
          y="15"
          width="90"
          height="50"
          rx="10"
          ry="10"
          fill="#EEF2FF"
          stroke="#6366F1"
          strokeWidth="2"
        />
        <text
          x="345"
          y="45"
          textAnchor="middle"
          fill="#1e1b4b"
          fontSize="14"
          fontFamily="system-ui, sans-serif"
        >
          Output
        </text>
      </svg>
    </div>
  );
}
