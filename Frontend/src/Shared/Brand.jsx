import { Cpu } from "lucide-react";
import { Link } from "react-router-dom";

// HireFlow logo + name. Used by the Navbar and the Footer so they always match.
const Brand = ({ animated = true, onClick }) => (
  <Link
    to="/"
    onClick={onClick}
    aria-label="HireFlow home"
    className="flex items-center gap-2.5 group w-fit rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
  >
    <div className="w-10 h-10 rounded-xl bg-violet/10 border border-violet-border flex items-center justify-center text-violet-text group-hover:bg-violet/20 group-hover:border-violet transition-colors">
      <Cpu className={`w-7 h-7 ${animated ? "motion-safe:animate-pulse" : ""}`} />
    </div>
    <span className="font-display font-bold text-ink text-2xl tracking-relax">HireFlow</span>
  </Link>
);

export default Brand;
