import './globals.css';

export const metadata = {
  title: 'Aegis — AI Gateway',
  description: 'Enterprise AI Gateway & Governance Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-console min-h-screen">{children}</body>
    </html>
  );
}
