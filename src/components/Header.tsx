import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";

const navLinks = [
  { href: "/#webdev", label: "Разработка" },
  { href: "/#advertising", label: "Реклама" },
  { 
    label: "Образовательным организациям",
    dropdown: [
      { href: "/frdo", label: "ФИС ФРДО" },
      { href: "/licensing", label: "Лицензирование" },
    ]
  },
  { href: "/portfolio", label: "Портфолио" },
  { href: "/#contact", label: "Контакты" },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-background/90 backdrop-blur-xl border-b border-border py-4" 
          : "bg-transparent py-6"
      }`}
    >
      <div className="container px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-display font-bold gradient-gold-text">
            24ZXC
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              'dropdown' in link ? (
                <div 
                  key={link.label} 
                  className="relative"
                  ref={dropdownRef}
                >
                  <button
                    onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {link.label}
                    <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {openDropdown === link.label && (
                    <div className="absolute top-full left-0 mt-2 py-2 min-w-[200px] bg-background border border-border rounded-md shadow-lg z-50 animate-fade-in">
                      {link.dropdown.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  key={link.href}
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors relative line-reveal"
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-8 pb-6 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                'dropdown' in link ? (
                  <div key={link.label}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                      className="w-full text-left text-lg py-3 text-muted-foreground hover:text-primary transition-colors border-b border-border flex items-center justify-between"
                    >
                      {link.label}
                      <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === link.label && (
                      <div className="pl-4 bg-secondary/30">
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            className="block text-base py-3 text-muted-foreground hover:text-primary transition-colors border-b border-border"
                            onClick={() => {
                              setOpenDropdown(null);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link 
                    key={link.href}
                    to={link.href}
                    className="text-lg py-3 text-muted-foreground hover:text-primary transition-colors border-b border-border"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
