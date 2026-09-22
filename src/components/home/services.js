import { TargetDart, BrowserDiv } from './serviceIcons.jsx'
import { BrainCircuit, Code2, Server, Smartphone, PenTool, Rocket, Layers, Compass } from 'lucide-react'

/**
 * The service cards in the hero (the desktop / tablet cluster and the phone's single card).
 * `title` is the label on the side cards; the featured card also shows `tagline` and `bullets`.
 *
 * ORDER matters: the cards are a ring, and the neighbours of the active service are drawn beside it. The reference design shows
 * [AI Solutions] ← [Digital Marketing] → [Custom Software Development] [Web Design & Development] [IT Consulting], so the
 * ring is ordered that way and starts on Digital Marketing (SERVICE_START); the services the project already had follow.
 * "Web Design & Development" and "IT Consulting" are the reference's names for the project's Web Development and Technology
 * Consulting. Taglines and bullets are draft marketing copy — review before launch.
 */
export const SERVICES = [
  {
    id: 'ai-automation', icon: BrainCircuit, title: 'AI Solutions',
    tagline: 'Intelligent solutions for smarter business growth.',
    bullets: ['Workflow & Process Automation', 'AI Chatbots & Assistants', 'Predictive Analytics & Insights', 'Systems Integration'],
  },
  {
    id: 'digital-marketing', icon: TargetDart, title: 'Digital Marketing',
    tagline: 'More visibility. More leads. More growth.',
    bullets: ['SEO & Local SEO', 'Google & Meta Ads', 'Social Media Marketing', 'Lead Generation'],
  },
  {
    id: 'custom-software', icon: Code2, title: 'Custom Software Development',
    tagline: 'Scalable software built around business requirements.',
    bullets: ['Business Process Digitisation', 'Web Apps & Client Portals', 'Multi-tenant SaaS Architecture', 'Maintenance & Scaling'],
  },
  {
    id: 'web-development', icon: BrowserDiv, title: 'Web Design & Development',
    tagline: 'Fast, secure websites and web apps built to convert.',
    bullets: ['Business & Corporate Websites', 'E-commerce Platforms', 'Web Apps & Client Portals', 'Performance & SEO-ready Builds'],
  },
  {
    id: 'tech-consulting', icon: Compass, title: 'IT Consulting',
    tagline: 'Clear technical direction before you build.',
    bullets: ['Technology Audit & Strategy', 'Architecture & Stack Selection', 'Cloud & Security Review', 'Delivery Roadmap'],
  },
  {
    id: 'crm-erp', icon: Server, title: 'CRM & ERP Solutions',
    tagline: 'Connected systems for efficient business operations.',
    bullets: ['Custom CRM Implementation', 'ERP for Operations & Finance', 'Sales & Pipeline Automation', 'Reporting Dashboards'],
  },
  {
    id: 'mobile-apps', icon: Smartphone, title: 'Mobile Applications',
    tagline: 'Native-quality apps for iOS and Android.',
    bullets: ['iOS & Android Development', 'Cross-platform Apps', 'App UX & Store Launch', 'Maintenance & Scaling'],
  },
  {
    id: 'ui-ux', icon: PenTool, title: 'UI/UX Design',
    tagline: 'Interfaces people understand at first glance.',
    bullets: ['Research & User Journeys', 'Wireframes & Prototypes', 'Design Systems', 'Usability Testing'],
  },
  {
    id: 'saas-mvp', icon: Rocket, title: 'SaaS / MVP Development',
    tagline: 'From idea to a launched product, fast.',
    bullets: ['MVP Scoping & Roadmap', 'Multi-tenant SaaS Architecture', 'Subscription & Billing Flows', 'Iterate with Real Users'],
  },
  {
    id: 'digital-solutions', icon: Layers, title: 'Digital Solutions',
    tagline: 'Custom digital systems built around your business.',
    bullets: ['Custom Software Development', 'Digital Marketing & SEO', 'Branding & Lead Generation', 'Business Process Digitisation'],
  },
]

/** the service the hero opens on (Digital Marketing — the one in the reference design) */
export const SERVICE_START = SERVICES.findIndex((s) => s.id === 'digital-marketing')

export const MARKETING_SERVICES = [
  { id: 'branding', title: 'Branding & Identity', text: 'Visual storytelling, cohesive design & identity.' },
  { id: 'social', title: 'Social Media Marketing', text: 'Community engagement, viral storytelling & growth.' },
  { id: 'performance', title: 'Performance Marketing', text: 'High ROAS Google & Meta Ads + intent optimization.' },
  { id: 'seo', title: 'SEO & Search Dominance', text: 'High intent search, SEO dominance & lead gen.' },
]
