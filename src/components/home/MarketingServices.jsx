import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Megaphone, Palette, Search, Share2 } from 'lucide-react'
import { MARKETING_SERVICES } from './services'

const ICONS = { branding: Palette, social: Share2, performance: Megaphone, seo: Search }

const list = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }
const item = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } }

/**
 * The section that follows the hero in the redesign: "Marketing That Starts With Your Business Goals".
 * Light surface, four service cards on the right — animates in as it scrolls into view.
 */
export default function MarketingServices() {
  return (
    <section id="marketing" className="relative bg-[#f3fbfa] overflow-hidden" aria-labelledby="marketing-title">
      <div className="mx-auto max-w-[1600px] px-5 sm:px-8 lg:px-[4.6vw] py-16 lg:py-20 grid lg:grid-cols-[minmax(0,34rem)_1fr] gap-10 lg:gap-14 items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-700/30 bg-white/70 px-4 py-1.5 text-[12px] font-bold tracking-[0.12em] uppercase text-teal-800">
            <span aria-hidden className="text-teal-600">✱</span> Our Digital Marketing Services
          </span>
          <h2 id="marketing-title" className="mt-5 font-['Manrope'] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#061a1d] text-[clamp(30px,3.2vw,50px)]">
            Marketing That Starts With <span className="text-teal-600">Your Business Goals.</span>
          </h2>
        </motion.div>

        <motion.ul variants={list} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 list-none p-0 m-0">
          {MARKETING_SERVICES.map((s) => {
            const Icon = ICONS[s.id]
            return (
              <motion.li key={s.id} variants={item}>
                <Link
                  to="/services"
                  className="group relative flex h-full min-h-[190px] flex-col rounded-[22px] border border-teal-900/10 bg-white p-6 shadow-[0_10px_34px_-18px_rgba(8,60,60,0.35)] transition-all duration-300 hover:-translate-y-1.5 hover:border-teal-500/50 hover:shadow-[0_22px_48px_-18px_rgba(13,148,136,0.45)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-[0_8px_18px_-8px_rgba(13,148,136,0.8)]">
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 text-teal-600/70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  <h3 className="mt-6 text-[15.5px] font-bold leading-snug text-[#0a2a2c]">{s.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{s.text}</p>
                </Link>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
