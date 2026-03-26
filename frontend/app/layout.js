import "./globals.css";
export const metadata = {
  title: "Cloud Drive",
  description: "Your personal cloud storage",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
