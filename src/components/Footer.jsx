import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiArrowUp } from "react-icons/hi2";
import {
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaFacebookF,
  FaWhatsapp,
} from "react-icons/fa";
import {
  HiOutlineMapPin,
  HiOutlineEnvelope,
  HiOutlinePhone,
} from "react-icons/hi2";

const XIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mt-0.5 opacity-70"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const AnimatedBackgroundIcons = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-[0.25]">
    <style>
      {`
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-15px) translateX(15px); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-25px) scale(1.1); }
        }
        .animate-float-1 { animation: float-1 7s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 9s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 8s ease-in-out infinite; }
      `}
    </style>

    {/* Rocket */}
    <div className="absolute top-10 left-[5%] animate-float-1 text-[#065A57]">
      <svg
        width="60"
        height="60"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
      </svg>
    </div>

    {/* Megaphone */}
    <div
      className="absolute top-1/3 right-[5%] animate-float-2 text-[#065A57]"
      style={{ animationDelay: "1s" }}
    >
      <svg
        width="70"
        height="70"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
    </div>

    {/* Target/Bullseye */}
    <div
      className="absolute bottom-20 left-[35%] animate-float-3 text-[#065A57]"
      style={{ animationDelay: "2s" }}
    >
      <svg
        width="55"
        height="55"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="6"></circle>
        <circle cx="12" cy="12" r="2"></circle>
      </svg>
    </div>

    {/* Line Chart */}
    <div
      className="absolute bottom-1/4 right-[25%] animate-float-1 text-[#065A57]"
      style={{ animationDelay: "3s" }}
    >
      <svg
        width="65"
        height="65"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
    </div>

    {/* Bar Chart */}
    <div
      className="absolute top-20 left-[45%] animate-float-2 text-[#065A57]"
      style={{ animationDelay: "1.5s" }}
    >
      <svg
        width="50"
        height="50"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    </div>
  </div>
);

const Diamond3D = () => {
  const faces = [0, 45, 90, 135, 180, 225, 270, 315];
  const crownColors = [
    "#FFF6D5",
    "#FBE7A1",
    "#F5D061",
    "#E6B422",
    "#B8860B",
    "#8A6516",
    "#E6B422",
    "#F5D061",
  ];
  const pavColors = [
    "#FBE7A1",
    "#F5D061",
    "#E6B422",
    "#B8860B",
    "#5C4310",
    "#8A6516",
    "#D4AF37",
    "#E6B422",
  ];

  return (
    <div
      className="relative w-[100px] h-[110px]"
      style={{
        transformStyle: "preserve-3d",
        animation: "diamond-spin 6s linear infinite",
      }}
    >
      {/* Equator */}
      <div
        className="absolute top-[30px] left-0 w-full h-0"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Table (Top Flat Face) */}
        <div
          className="absolute top-0 left-1/2 opacity-90 border border-white/40"
          style={{
            width: "60px",
            height: "60px",
            background: "#FFF3C4",
            clipPath:
              "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            transformOrigin: "center",
            transform: "translate(-50%, -50%) translateY(-30px) rotateX(90deg)",
          }}
        />

        {/* Crown (Top Slanted Faces) */}
        {faces.map((angle, i) => (
          <div
            key={`crown-${i}`}
            className="absolute bottom-0 left-1/2 opacity-90 border border-white/40"
            style={{
              width: "41.42px",
              height: "36.05px",
              background: crownColors[i],
              clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)",
              transformOrigin: "bottom center",
              transform: `translateX(-50%) rotateY(${angle}deg) translateZ(50px) rotateX(33.69deg)`,
            }}
          />
        ))}

        {/* Pavilion (Bottom Pointed Faces) */}
        {faces.map((angle, i) => (
          <div
            key={`pav-${i}`}
            className="absolute top-0 left-1/2 opacity-90 border border-white/40"
            style={{
              width: "41.42px",
              height: "94.34px",
              background: pavColors[i],
              clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
              transformOrigin: "top center",
              transform: `translateX(-50%) rotateY(${angle}deg) translateZ(50px) rotateX(-32deg)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "Industries", href: "/#industries" },
  // { label: "Case Studies", href: "/#case-studies" },
  { label: "Contact", href: "/#contact" },
];

const serviceLinks = [
  { label: "Search Engine Optimization (SEO)", href: "/#services" },
  { label: "Google Ads (PPC)", href: "/#services" },
  { label: "Social Media Marketing", href: "/#services" },
  { label: "Web Design & Development", href: "/#services" },
  { label: "Branding & Creative Design", href: "/#services" },
  { label: "Content Marketing", href: "/#services" },
  { label: "AI Automation", href: "/#services" },
  { label: "Lead Generation", href: "/#services" },
];


const linkCols = [
  { title: "Quick Links", links: quickLinks, chevron: true },
  { title: "Services", links: serviceLinks, chevron: false },
 
];

// Reveal + stagger for the footer columns as they scroll into view.
const colReveal = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function Footer() {
  return (
    <>
      <style>
        {`
          @keyframes diamond-spin {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(-360deg); }
          }
          @keyframes ft-glow { 0%,100% { opacity:.45; transform:scale(1); } 50% { opacity:.8; transform:scale(1.12); } }
          @keyframes ft-shimmer { 0% { transform:translateX(-120%); } 100% { transform:translateX(120%); } }
          .ft-glow { animation: ft-glow 7s ease-in-out infinite; }
          .ft-link { position: relative; }
          .ft-link::after { content:''; position:absolute; left:0; bottom:-2px; height:1.5px; width:0; background:linear-gradient(90deg,#F5D061,#E6B422); transition:width .3s ease; }
          .ft-link:hover::after { width:100%; }
          @keyframes ft-gemfloat { 0%,100% { transform:translateY(0) rotate(-5deg); } 50% { transform:translateY(-9px) rotate(5deg); } }
          @keyframes ft-gemglow { 0%,100% { opacity:.55; transform:scale(1); } 50% { opacity:.9; transform:scale(1.15); } }
          @keyframes ft-logofloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
          .ft-gem { animation: ft-gemfloat 4.5s ease-in-out infinite; }
          .ft-gem-glow { animation: ft-gemglow 4.5s ease-in-out infinite; }
          .ft-logo { animation: ft-logofloat 5.5s ease-in-out infinite; }
          @keyframes ft-spin { to { transform: rotate(360deg); } }
          @keyframes ft-spin-rev { to { transform: rotate(-360deg); } }
          .ft-orbit { animation: ft-spin 18s linear infinite; }
          .ft-orbit-rev { animation: ft-spin-rev 14s linear infinite; }
          /* the lone climber — walks the footer's top edge left → right, then
             loops: crosses, exits right, re-enters from the left, forever. */
          @keyframes ft-walk { 0% { transform: translateX(-200px); } 100% { transform: translateX(100vw); } }
          .ft-walker { animation: ft-walk 13s linear infinite; will-change: transform; }
          @media (prefers-reduced-motion: reduce) { .ft-glow, .ft-gem, .ft-gem-glow, .ft-logo, .ft-orbit, .ft-orbit-rev { animation:none; } .ft-walker { animation:none; transform: translateX(8vw); } }
        `}
      </style>

      {/* the climber walks the white shelf just above the footer, left → right,
          looping forever — onward and upward, right up to the brand. It lives
          outside the footer because the footer clips (overflow-hidden), so this
          keeps it on the white space rather than inside the teal. */}
      <div aria-hidden className="relative overflow-hidden h-24 md:h-32 mt-16 md:mt-20 pointer-events-none">
        <img
          src="./climb%20stairs%20to%20success.svg"
          alt=""
          className="ft-walker absolute bottom-0 left-0 h-24 md:h-32 w-auto select-none drop-shadow-[0_10px_16px_rgba(2,63,67,0.18)]"
        />
      </div>

      <footer
        className="relative overflow-hidden text-white pb-4 font-sans"
        style={{ background: "linear-gradient(180deg, #008B8B 0%, #05676a 55%, #023f43 100%)" }}
      >
        {/* soft brand glows behind the content */}
        <div aria-hidden className="ft-glow pointer-events-none absolute -top-8 left-[14%] w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(245,208,97,0.16), transparent 70%)", filter: "blur(20px)" }} />
        <div aria-hidden className="ft-glow pointer-events-none absolute bottom-0 right-[8%] w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(10,186,181,0.22), transparent 70%)", filter: "blur(26px)", animationDelay: "2.5s" }} />
        {/* Top Curve - Sharp Bottom V-Notch with Diamond extending above the footer */}
        <div className="absolute top-0 left-0 w-full h-[50px] md:h-[80px] transform -translate-y-[99%] flex items-end drop-shadow-[0_-5px_10px_rgba(0,0,0,0.08)] z-10 pointer-events-none">
          {/* Left straight part with rounded corner */}
          <div className="flex-1 h-full bg-[#008B8Bff] rounded-tl-[1.5rem] md:rounded-tl-[2.5rem]"></div>

          {/* Center V-Notch SVG with 5px radius top corners */}
          <svg
            className="w-[150px] md:w-[220px] h-full text-[#008B8Bff] shrink-0"
            viewBox="0 0 400 160"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 L24,0 Q 32,0 38,5 L200,140 L362,5 Q 368,0 376,0 L400,0 L400,160 L0,160 Z"
              fill="currentColor"
            />
          </svg>

          {/* Right straight part with rounded corner */}
          <div className="flex-1 h-full bg-[#008B8Bff] rounded-tr-[1.5rem] md:rounded-tr-[2.5rem]"></div>

          {/* The Diamond */}
          <div className="absolute left-1/2 bottom-[15px] md:bottom-[20px] transform -translate-x-1/2 z-20 pointer-events-none drop-shadow-[0_0_25px_rgba(212,175,55,0.9)]">
            <div style={{ perspective: "1200px" }}>
              <div
                className="hidden md:block"
                style={{
                  transform: "scale3d(1.8, 0.9, 1.8)",
                  transformOrigin: "bottom center",
                }}
              >
                <Diamond3D />
              </div>
              <div
                className="block md:hidden"
                style={{
                  transform: "scale3d(1.3, 0.7, 1.3)",
                  transformOrigin: "bottom center",
                }}
              >
                <Diamond3D />
              </div>
            </div>
          </div>
        </div>

        <AnimatedBackgroundIcons />

        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-4">
            {/* Logo & Follow Us */}
            <motion.div className="lg:col-span-3" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={colReveal}>
              {/* brand lockup — the logo framed inside a diamond, with graphics */}
              <Link to="/" className="flex items-center gap-3 mb-4">
                <span className="relative grid place-items-center w-16 h-16 shrink-0">
                  {/* soft glow */}
                  <span aria-hidden className="ft-gem-glow absolute inset-0 rounded-full blur-lg" style={{ background: "radial-gradient(circle, rgba(245,208,97,0.5), transparent 70%)" }} />
                  {/* rotating dashed ring + orbiting dot */}
                  <span aria-hidden className="ft-orbit absolute w-16 h-16 rounded-full border border-dashed border-[#F5D061]/40">
                    <span className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#F5D061] shadow-[0_0_8px_rgba(245,208,97,0.9)]" />
                  </span>
                  {/* the diamond frame (rotated square, teal→gold edge) */}
                  <span aria-hidden className="absolute w-11 h-11 rotate-45 rounded-[10px] shadow-[0_6px_18px_-6px_rgba(245,208,97,0.6)]" style={{ background: "linear-gradient(135deg,#F5D061,#0ABAB5)", padding: "2px" }}>
                    <span className="block w-full h-full rounded-[8px] bg-gradient-to-br from-[#045c5e] to-[#023f43]" />
                  </span>
                  {/* the logo, sitting upright inside the diamond */}
                  <img src="/img/home/visionbitzpng.png" alt="Vision Bitz" className="relative w-8 h-8 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                  {/* sparkle accents */}
                  <span aria-hidden className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
                  <span aria-hidden className="absolute bottom-1.5 left-1 w-1 h-1 rounded-full bg-[#0ABAB5] shadow-[0_0_6px_#0ABAB5]" />
                </span>
                <img src="/img/VB 2.png" alt="Vision Bitz Techno Solutions" className="w-[140px] object-contain" />
              </Link>
              <p className="text-white/75 text-[13.5px] leading-relaxed mb-5 max-w-xs">
                Results-driven digital marketing & technology — helping brands get
                seen, get leads, and grow.
              </p>

              <div>
                <h4 className="text-[#F5D061] font-bold text-[13px] tracking-wider mb-3 uppercase">
                  Follow Us
                </h4>
                <div className="flex items-center gap-3">
                  {[
                    { icon: FaFacebookF, href: "https://www.facebook.com/profile.php?id=61591663134460", label: "Facebook", styles: "text-[#1877F2] hover:bg-[#1877F2] hover:text-white" },
                    { icon: FaInstagram, href: "https://www.instagram.com/visionbitztechnosolutions/", label: "Instagram", styles: "text-[#E4405F] hover:bg-[#E4405F] hover:text-white" },
                    { icon: FaLinkedinIn, href: "#", label: "LinkedIn", styles: " text-[#0077B5] hover:bg-[#0077B5] hover:text-white" },
                    { icon: XIcon, href: "https://x.com/Vision_Bitz", label: "X", styles: " text-black hover:bg-black hover:text-white" },
                    { icon: FaYoutube, href: "https://www.youtube.com/@visionbitztechnosolutions", label: "YouTube", styles: " text-[#FF0000] hover:bg-[#FF0000] hover:text-white" },
                  ].map(({ icon: Icon, href, label, styles }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className={`w-9 h-9 bg-white/90 flex items-center justify-center rounded-full border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:shadow-lg ${styles}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Quick Links Group Container */}
            <div className="lg:col-span-9 grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 lg:gap-8">
              {linkCols.map((col) => (
                <motion.div
                  key={col.title}
                  className="w-full"
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={colReveal}
                >
                  <div className="mb-3">
                    <h4 className="text-white font-bold text-[13px] tracking-widest uppercase">
                      {col.title}
                    </h4>
                    <div className="w-8 h-[2px] mt-2 rounded-full bg-gradient-to-r from-[#F5D061] to-[#E6B422]" />
                  </div>
                  <ul className="space-y-1.5">
                    {col.links.map(({ label, href }) => (
                      <li key={label}>
                        <a
                          href={href}
                          className="ft-link text-white/80 hover:text-[#F5D061] text-[14px] flex items-start gap-2 transition-colors"
                        >
                          {col.chevron && <ChevronIcon />}
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}

              {/* Contact */}
              <motion.div
                className="w-full"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                variants={colReveal}
              >
                <div className="mb-3">
                  <h4 className="text-white font-bold text-[13px] tracking-widest uppercase">
                    Contact
                  </h4>
                  <div className="w-8 h-[2px] mt-2 rounded-full bg-gradient-to-r from-[#F5D061] to-[#E6B422]" />
                </div>

                <div className="mb-2 mt-4">
                  <h5 className="font-bold text-white text-[15px]">
                    Vision Bitz Techno Solutions
                  </h5>
                </div>

                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <HiOutlineEnvelope className="w-4 h-4 text-[#F5D061] flex-shrink-0" />
                    <a
                      href="mailto:connect@visionbitz.com"
                      className="ft-link text-white/80 hover:text-[#F5D061] text-[14px] transition-colors"
                    >
                      connect@visionbitz.com
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <HiOutlinePhone className="w-4 h-4 text-[#F5D061] flex-shrink-0" />
                    <a
                      href="tel:+919597056711"
                      className="ft-link text-white/80 hover:text-[#F5D061] text-[14px] transition-colors"
                    >
                      +91 95970 56711
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaWhatsapp className="w-4 h-4 text-[#F5D061] flex-shrink-0" />
                    <a
                      href="https://wa.me/919597056711?text=Hi%20VisionBitz!%20I%20would%20like%20to%20enquire%20about%20your%20services."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ft-link text-white/80 hover:text-emerald-300 font-bold text-[14px] transition-colors flex items-center gap-1.5"
                    >
                      WhatsApp Enquiry
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <HiOutlineMapPin className="w-4 h-4 text-[#F5D061] flex-shrink-0 mt-0.5" />
                    <span className="text-white/80 text-[14px] leading-snug">
                      Coimbatore, Tamil Nadu, India
                    </span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 pt-4 border-t border-white/15 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/70 text-xs">
              © 2026 VisionBitz Techno Solutions. All Rights Reserved.
            </p>
            <p className="text-[#F5D061] text-xs font-semibold tracking-wide">
              Turning Vision into Digital Success.
            </p>
            {/* <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group inline-flex items-center gap-2 text-white/80 hover:text-[#F5D061] text-xs font-semibold transition-colors"
              aria-label="Back to top"
            >
              Back to top
              <span className="grid place-items-center w-6 h-6 rounded-full bg-white/10 group-hover:bg-[#F5D061]/25 transition-all duration-300 group-hover:-translate-y-0.5">
                <HiArrowUp className="w-3.5 h-3.5" />
              </span>
            </button> */}
          </div>
        </div>
      </footer>
    </>
  );
}