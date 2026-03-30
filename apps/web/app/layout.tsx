/**
 * Root layout — minimal shell required by Next.js App Router.
 * Real layout (with providers, fonts, etc.) lives in app/[locale]/layout.tsx.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
