import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaBus,
  FaClock,
  FaShieldAlt,
} from "react-icons/fa";

const RouteStyleFooter = () => {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const navigationLinks = [
    { name: "Home", href: "/" },
    { name: "Journey", href: "/booking" },
    { name: "FAQ", href: "/faq" },
  ];

  const footerLinks = {
    company: [
      { name: "About Us", href: "#" },
      { name: "Our Services", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Press", href: "#" },
    ],
    support: [
      { name: "Help Center", href: "#" },
      { name: "Contact Us", href: "#" },
      { name: "Booking Guide", href: "#" },
      { name: "Refund Policy", href: "#" },
    ],
    legal: [
      { name: "Terms of Service", href: "#" },
      { name: "Privacy Policy", href: "#" },
      { name: "Cookie Policy", href: "#" },
      { name: "Travel Guidelines", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: FaFacebook, href: "#", label: "Facebook" },
    { icon: FaTwitter, href: "#", label: "Twitter" },
    { icon: FaInstagram, href: "#", label: "Instagram" },
    { icon: FaLinkedin, href: "#", label: "LinkedIn" },
    { icon: FaYoutube, href: "#", label: "YouTube" },
  ];

  useEffect(() => {
    const footerElement = footerRef.current;
    if (!footerElement) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(footerElement);
    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className={`bg-gray-900 text-white ${isVisible ? "footer-visible" : ""}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="footer-animate footer-delay-1">
              <div className="mb-4 flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
                  <span className="text-xl font-bold text-white">W</span>
                </div>
                <span className="text-xl font-bold">WayGo</span>
              </div>

              <p className="footer-animate footer-delay-2 mb-6 leading-relaxed text-gray-300">
                Sri Lanka&apos;s trusted bus booking platform for comfortable, safe, and affordable trips.
              </p>

              <div className="space-y-3">
                <div className="footer-animate footer-delay-3 flex items-center gap-3 text-gray-300">
                  <FaMapMarkerAlt className="text-blue-400" />
                  <span>123 Galle Road, Colombo 03, Sri Lanka</span>
                </div>
                <div className="footer-animate footer-delay-4 flex items-center gap-3 text-gray-300">
                  <FaPhone className="text-blue-400" />
                  <span>+94 11 234 5678</span>
                </div>
                <div className="footer-animate footer-delay-5 flex items-center gap-3 text-gray-300">
                  <FaEnvelope className="text-blue-400" />
                  <span>info@waygo.lk</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="footer-social flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-blue-600"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="footer-animate footer-delay-2 mb-6 text-lg font-semibold">
              Navigate
            </h4>
            <ul className="space-y-3">
              {navigationLinks.map((link, index) => (
                <li key={link.name} className={`footer-animate footer-delay-${index + 3}`}>
                  <Link to={link.href} className="text-gray-300 transition-colors duration-300 hover:text-blue-400 hover:underline">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="footer-animate footer-delay-3 mb-6 text-lg font-semibold">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={link.name} className={`footer-animate footer-delay-${index + 4}`}>
                  <a href={link.href} className="text-gray-300 transition-colors duration-300 hover:text-blue-400">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="footer-animate footer-delay-4 mb-6 text-lg font-semibold">
              Support
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={link.name} className={`footer-animate footer-delay-${index + 5}`}>
                  <a href={link.href} className="text-gray-300 transition-colors duration-300 hover:text-blue-400">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="footer-animate footer-delay-5 mb-6 text-lg font-semibold">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={link.name} className={`footer-animate footer-delay-${index + 6}`}>
                  <a href={link.href} className="text-gray-300 transition-colors duration-300 hover:text-blue-400">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 border-t border-gray-800 pt-8 md:grid-cols-3">
          <div className="footer-animate footer-feature footer-delay-14 flex items-center gap-3">
            <FaBus className="text-xl text-blue-400" />
            <div>
              <div className="font-semibold">Modern Fleet</div>
              <div className="text-sm text-gray-400">Luxury AC buses</div>
            </div>
          </div>

          <div className="footer-animate footer-feature footer-delay-15 flex items-center gap-3">
            <FaClock className="text-xl text-blue-400" />
            <div>
              <div className="font-semibold">On Time</div>
              <div className="text-sm text-gray-400">95% punctuality</div>
            </div>
          </div>

          <div className="footer-animate footer-feature footer-delay-16 flex items-center gap-3">
            <FaShieldAlt className="text-xl text-blue-400" />
            <div>
              <div className="font-semibold">Safe Travel</div>
              <div className="text-sm text-gray-400">Certified drivers</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="footer-animate footer-delay-2 mb-4 text-sm text-gray-400 md:mb-0">
              © {currentYear} WayGo Transport System. All rights reserved.
            </div>
            <div className="footer-animate footer-delay-3 flex items-center gap-6 text-sm text-gray-400">
              <span className="footer-animate footer-delay-4">Made in Sri Lanka</span>
              <div className="footer-animate footer-delay-5 flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default RouteStyleFooter;
