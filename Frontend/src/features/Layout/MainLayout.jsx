import Navbar from "../Home/Navbar";
import Footer from "../Home/Footer";
import { Outlet } from "react-router-dom";

// Every page inside this layout gets the Navbar and Footer.
// Login and Register are routed outside it, so they have neither.
const MainLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
};

export default MainLayout;
