import Nav from "../components/Nav";
import "../styles/globals.css";
export const metadata = {
  title: "Nyeusi",
  description: "Discover Talents",
};

const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body className="bg-black">
        <main className="app">
          <Nav />
          {children}
        </main>
      </body>
    </html>
  );
};

export default RootLayout;
