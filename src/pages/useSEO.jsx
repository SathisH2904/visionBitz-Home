import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://www.visionbitz.com";

const seoData = {
  home:       { title: "Best Digital Marketing Agency in Coimbatore | Vision Bitz", description: "Vision Bitz Techno Solutions offers SEO, Google Ads, social media marketing, branding and web development in Coimbatore.", keywords: "Digital Marketing Company,Digital Marketing Services,SEO Services ,Google Ads,Social Media Marketing,Website Development", path: "/" },
  about:      { title: "About Vision Bitz | Digital Marketing Company in Coimbatore", description: "Learn about Vision Bitz, a trusted digital marketing company in Coimbatore helping businesses grow with innovative marketing solutions.", keywords: "Digital Marketing Company, Digital Marketing Experts, Digital Growth Agency, Online Marketing Company ,SEO Company", path: "/about" },
  services:   { title: "Digital Marketing Services in Coimbatore | Vision Bitz", description: "Explore digital marketing services including SEO, Google Ads, social media marketing, branding and website development.", keywords: "SEO Services, Social Media Marketing Services, Website Development Services, Google Ads service, Branding service,AI Aiutomation Services", path: "/services" },
  industries: { title: "Industries We Serve | Vision Bitz Coimbatore", description: "Explore industry-specific digital marketing services tailored for healthcare, education, real estate, retail, manufacturing and more.", keywords: "Digital Marketing for Healthcare,Education,Real Estate,Manufacturing,Retail ,E-commerce,Startups,Small Businesses", path: "/industries" },
  contact:    { title: "Contact Vision Bitz | Digital Marketing in Coimbatore", description: "Contact Vision Bitz Techno Solutions for SEO, Google Ads, social media marketing, website development and branding services.", keywords: "Digital Marketing Services,SEO Services,Google Ads Agency,Social Media Marketing Agency,Web Development Company,Digital Marketing Consultant", path: "/contact" },
};

function setTag(selector, attr, value) {
  if (!value) return;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith("link") ? "link" : "meta");
    if (selector.includes("canonical")) el.setAttribute("rel", "canonical");
    else if (selector.includes("description")) el.setAttribute("name", "description");
    else if (selector.includes("keywords")) el.setAttribute("name", "keywords");
    else if (selector.includes("robots")) el.setAttribute("name", "robots");
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

// Call this once per page component with a fixed key — e.g. useSEO("about")
export function useSEO(key) {
  useEffect(() => {
    const data = seoData[key];
    if (!data) return;
    document.title = data.title;
    setTag('meta[name="description"]', "content", data.description);
    setTag('meta[name="keywords"]', "content", data.keywords);
    setTag('meta[name="robots"]', "content", data.robots || "index, follow");
    setTag('link[rel="canonical"]', "href", `${SITE_URL}${data.path}`);
  }, [key]);
}

// Call this once, at the top of App.jsx, to handle the "/" single page —
// it just reads the current hash directly, no scroll tracking involved
export function useHashSEO() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") return;
    const key = location.hash ? location.hash.slice(1) : "home";
    const data = seoData[key] || seoData.home;
    document.title = data.title;
    setTag('meta[name="description"]', "content", data.description);
    setTag('meta[name="keywords"]', "content", data.keywords);
    setTag('meta[name="robots"]', "content", data.robots || "index, follow");

    const canonicalUrl = key === "home" ? SITE_URL : `${SITE_URL}/#${key}`;
    setTag('link[rel="canonical"]', "href", canonicalUrl);
  }, [location.pathname, location.hash]);

  return null;
}