import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'   // added useNavigate
import { motion, AnimatePresence } from 'framer-motion'

import {
  HiMenu, HiX, HiChevronDown,
  HiSearch, HiGlobe, HiTrendingUp, HiShare,
  HiCode, HiPencil, HiLightningBolt, HiUserGroup, HiShoppingCart,
  HiHeart, HiHome, HiAcademicCap, HiCurrencyDollar, HiChip, HiOfficeBuilding,
  HiCog, HiArrowRight, HiChatAlt2
} from 'react-icons/hi'



export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [navTextColor, setNavTextColor] = useState('white')
  const [activeSection, setActiveSection] = useState('')
  const location = useLocation()
  const navigate = useNavigate()   // added
  const timeoutRef = useRef(null)
  // over the dark home hero (not yet scrolled) the bar is translucent dark with light text
  const onDark = location.pathname === '/' && !isScrolled

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)

      if (location.pathname === '/') {
        // Transition navbar color when scrolling past the 100vh home hero section
        const homeSectionHeight = window.innerHeight * 0.9
        if (window.scrollY < homeSectionHeight) {
          setNavTextColor('white')
        } else {
          setNavTextColor('teal')
        }
      } else {
        setNavTextColor('teal')
      }

      // ScrollSpy logic
      const sections = ['contact', 'blogs', 'industries', 'services', 'about']
      let currentSection = ''
      for (const section of sections) {
        const el = document.getElementById(section)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= window.innerHeight * 0.4 && rect.bottom > 0) {
            currentSection = section
            break
          }
        }
      }
      setActiveSection(currentSection)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initialize on mount and location change

    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  useEffect(() => {
    setMobileOpen(false)
    setActiveDropdown(null)
  }, [location])

  const handleMouseEnter = (key) => {
    clearTimeout(timeoutRef.current)
    setActiveDropdown(key)
  }
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 120)
  }

  // Active-tab check with ScrollSpy integration
  const isActive = (path) => {
    // 1. Home link
    if (path === '/') {
      return location.pathname === '/' && activeSection === ''
    }

    const key = path.replace(/^[/#]+/, '')

    // 2. On dedicated pages (e.g. /blog, /blog/some-post, /about, etc.)
    if (location.pathname !== '/') {
      const pathSegment = location.pathname.split('/')[1]
      return (
        pathSegment === key ||
        (pathSegment === 'blog' && (key === 'blogs' || key === 'blog')) ||
        (pathSegment === 'blogs' && (key === 'blog' || key === 'blogs'))
      )
    }

    // 3. On Home page ('/'): activeSection is the source of truth for scrolling
    if (activeSection) {
      return (
        activeSection === key ||
        (activeSection === 'blogs' && (key === 'blog' || key === 'blogs')) ||
        (activeSection === 'blog' && (key === 'blogs' || key === 'blog'))
      )
    }

    return false
  }

  // Dynamic link class based on scroll position and page
  // the hero is light now → always use dark/teal nav styling (readable on white)
  const linkClass = (path) =>
    `px-4 py-2 rounded-tl-[5px] rounded-bl-[15px] rounded-tr-[15px] rounded-br-[5px] text-[15px] font-semibold whitespace-nowrap transition-all duration-300 ${isActive(path)
      ? (onDark ? 'text-[#35e8c7] shadow-[inset_0_-2px_0_#35e8c7]' : 'bg-gradient-to-r from-[#E7C24E] to-[#C9A24B] text-[#2a1d00] shadow-[0_0_18px_rgba(201,162,75,0.45)]')
      : (onDark ? 'text-white/85 hover:bg-white/10 hover:text-white' : 'text-[#008B8B] hover:bg-[#C9A24B] hover:text-[#2a1d00]')
    }`

  const mobileLinkClass = (path) =>
    `block px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${isActive(path)
      ? 'bg-gradient-to-r from-[#E7C24E] to-[#C9A24B] text-[#2a1d00]'
      : 'text-slate-700 hover:bg-slate-50 hover:text-[#008B8B]'
    }`

  /* Scroll a section fully into view. Native `#hash` jumps land imprecisely on
     these full-height, animated sections (half a page showing), so we take
     over: measure the target and scroll to its top, offset by the floating
     navbar. The section itself is responsible for revealing its own content. */
  const NAV_OFFSET = 96
  const scrollToSection = (e, id) => {
  if (e) e.preventDefault()
  setMobileOpen(false)
  if (location.pathname !== '/') {
    navigate(`/#${id}`)
    return
  }
  const go = () => {
    const el = document.getElementById(id)
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    navigate(`#${id}`, { replace: true })
    window.dispatchEvent(new CustomEvent('vb:navigate', { detail: id }))
  }
  if (mobileOpen) setTimeout(go, 60)
  else go()
}
  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center w-full px-4 pointer-events-none">
      <div className="relative pointer-events-auto w-full lg:w-[95%] max-w-[1300px]">

        {/* Main Navbar Pill */}
        <header
          className={`transition-all duration-300 flex items-center justify-between px-4 lg:pl-8 lg:pr-6 py-1.5
            ${(isScrolled || location.pathname !== '/') ? 'bg-white shadow-md text-[#008B8B]' : 'bg-[#061c20]/55 backdrop-blur-md border border-white/10 text-white'}
            rounded-tl-[8px] rounded-bl-[2rem] rounded-tr-[2rem] rounded-br-[8px]
            gap-4 lg:gap-8 w-full`}
        >
          {/* Logo + extra images */}


          {/* Logo + extra images */}
          <Link to="/" className="flex items-center gap-1 shrink-0">
            <img
              src="/img/home/visionbitzpng.png"
              alt="Vision Bitz"
              className="h-11 sm:h-12 w-11 sm:w-12 object-cover"
            />


            {/* light wordmark over the hero, dark wordmark on the frosted-light bar */}
            {onDark ? (
              <span className="flex flex-col leading-none pl-1">
                <span className="text-[26px] sm:text-[28px] font-semibold tracking-tight text-white" style={{ fontFamily: 'Manrope, Inter, sans-serif' }}>Vision Bitz</span>
                <span className="mt-1 text-[9px] tracking-[0.32em] text-white/70 uppercase">Techno Solutions</span>
              </span>
            ) : (
              <img
                src="/img/VB 2.png"
                alt="Vision Bitz partner"
                className="w-[128px] sm:w-[148px] object-contain"
              />
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center justify-center flex-1 gap-4">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={linkClass('/')}>Home</Link>
            <a href="#services" onClick={(e) => scrollToSection(e, 'services')} className={linkClass('#services')}>Services</a>
            <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className={linkClass('#about')}>About Us</a>
            <Link to="/case-studies" className={linkClass('/case-studies')}>Case Studies</Link>
            <a href="#blogs" onClick={(e) => scrollToSection(e, 'blogs')} className={linkClass('#blogs')}>Blog</a>
            <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className={linkClass('#contact')}>Contact</a>
          </nav>

          {/* CTA / Separator */}
          <div className="hidden lg:flex items-center gap-4 pl-6 border-l border-white/15 shrink-0">
            <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className={`${onDark ? 'bg-[#35e8c7] text-[#04211d] shadow-[0_0_24px_rgba(53,232,199,0.4)] hover:shadow-[0_0_44px_rgba(53,232,199,0.6)]' : 'bg-gradient-to-r from-[#E7C24E] via-[#C9A24B] to-[#b8860b] text-[#2a1d00] shadow-[0_0_24px_rgba(201,162,75,0.4)] hover:shadow-[0_0_44px_rgba(201,162,75,0.6)]'} group relative overflow-hidden font-semibold text-sm px-5 py-2 rounded-tl-[5px] rounded-bl-[15px] rounded-tr-[15px] rounded-br-[5px] flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5`}>
              <span className="relative z-10 flex items-center gap-2">
                Get a free proposal <HiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
              <span
                aria-hidden
                className="vb-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                style={{ animation: "vb-shine 4s ease-in-out infinite" }}
              />
            </a>
          </div>

          {/* Mobile toggle button (Adapted to ice-mint color text layout) */}
          <button
            className="lg:hidden p-2 rounded-xl transition-colors shrink-0 text-[#008B8B] hover:bg-teal-50"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Menu Expansion panel */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 12 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 lg:hidden overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100"
            >
              <div className="px-4 py-4 space-y-1">
                <Link to="/" onClick={() => { setMobileOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); if (history.replaceState) history.replaceState(null, '', '/'); }} className={mobileLinkClass('/')}>Home</Link>
                <a href="#services" onClick={(e) => scrollToSection(e, 'services')} className={mobileLinkClass('#services')}>Services</a>
                <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className={mobileLinkClass('#about')}>About Us</a>
                <Link to="/case-studies" className={mobileLinkClass('/case-studies')}>Case Studies</Link>
                <a href="#blogs" onClick={(e) => scrollToSection(e, 'blogs')} className={mobileLinkClass('#blogs')}>Blog</a>
                <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} className={mobileLinkClass('#contact')}>Contact</a>

                <div className="pt-3 flex flex-col gap-2">
                  <a
                    href="#contact"
                    onClick={(e) => scrollToSection(e, 'contact')}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-semibold text-[#2a1d00] text-sm bg-gradient-to-r from-[#E7C24E] via-[#C9A24B] to-[#b8860b] shadow-[0_0_24px_rgba(201,162,75,0.4)]"
                  >
                    Get a free proposal <HiArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}