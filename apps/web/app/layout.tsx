/**
 * Root layout — pass-through. Next.js App Router requires a root layout, but
 * `<html>`/`<body>` are rendered by `app/[locale]/layout.tsx` so `lang` can
 * be set per-locale. Rendering them here too would nest them in dev.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return children;
}
