/* eslint-disable @typescript-eslint/no-empty-object-type */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MessageCircle,
  Bookmark,
  User,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { NavItem } from "@/types";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface SideNavigationProps {
  // No longer need activeRoute or onNavigate - using Next.js routing
}

export function SideNavigation({}: SideNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navItems: NavItem[] = [
    {
      id: "home",
      label: "Home",
      icon: "home",
      route: "/",
      isActive: pathname === "/",
    },
    {
      id: "chat",
      label: "Chat",
      icon: "message-circle",
      route: "/domains",
      isActive: pathname.startsWith("/chat") || pathname.startsWith("/domains"),
    },
    {
      id: "collection",
      label: "Collection",
      icon: "bookmark",
      route: "/collections",
      isActive: pathname.startsWith("/collections"),
    },
    {
      id: "profile",
      label: "Profile",
      icon: "user",
      route: "/profile",
      isActive: pathname === "/profile",
    },
  ];

  const getIcon = (iconName: string, isActive: boolean) => {
    const iconProps = {
      className: `w-5 h-5 transition-colors duration-200 ${
        isActive ? "text-purple-primary" : "text-text-secondary"
      }`,
    };

    switch (iconName) {
      case "home":
        return <Home {...iconProps} />;
      case "message-circle":
        return <MessageCircle {...iconProps} />;
      case "bookmark":
        return <Bookmark {...iconProps} />;
      case "user":
        return <User {...iconProps} />;
      default:
        return <Home {...iconProps} />;
    }
  };

  const handleNavClick = (item: NavItem) => {
    router.push(item.route);
    // Close mobile menu after navigation
    if (window.innerWidth < 1024) {
      setIsExpanded(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <motion.button
        onClick={toggleExpanded}
        className="fixed top-4 left-4 z-50 lg:hidden bg-surface-white border border-gray-200 rounded-lg p-2 shadow-lg"
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isExpanded ? (
          <X className="w-5 h-5 text-text-primary" />
        ) : (
          <Menu className="w-5 h-5 text-text-primary" />
        )}
      </motion.button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Side Navigation */}
      <motion.div
        className={`fixed left-0 top-0 h-full z-50 bg-surface-white border-r border-gray-200 shadow-xl flex flex-col transition-all duration-300 ease-in-out ${
          isExpanded ? "w-64" : "w-16"
        } lg:w-16 lg:hover:w-64 lg:relative lg:shadow-none`}
        initial={{ x: -100, opacity: 0 }}
        animate={{
          x: isExpanded || (isMounted && window.innerWidth >= 1024) ? 0 : -100,
          opacity: 1,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onMouseEnter={() => {
          if (isMounted && window.innerWidth >= 1024) setIsExpanded(true);
        }}
        onMouseLeave={() => {
          if (isMounted && window.innerWidth >= 1024) setIsExpanded(false);
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <motion.div
            className="flex items-center space-x-3"
            animate={{ justifyContent: isExpanded ? "flex-start" : "center" }}
          >
            <div className="w-8 h-8 bg-purple-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h2 className="font-semibold text-text-primary whitespace-nowrap">
                    LegalKaki
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4">
          <ul className="space-y-2 px-3">
            {navItems.map((item, index) => (
              <motion.li
                key={item.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <motion.button
                  onClick={() => handleNavClick(item)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    item.isActive
                      ? "bg-purple-subtle text-purple-primary"
                      : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
                  }`}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div
                    animate={
                      item.isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }
                    }
                    transition={{ duration: 0.3 }}
                    className="flex-shrink-0"
                  >
                    {getIcon(item.icon, item.isActive || false)}
                  </motion.div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        className="font-medium whitespace-nowrap"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active indicator */}
                  {item.isActive && (
                    <motion.div
                      className="absolute left-0 w-1 h-8 bg-purple-primary rounded-r-full"
                      layoutId="sideActiveIndicator"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ type: "spring", duration: 0.4 }}
                    />
                  )}
                </motion.button>
              </motion.li>
            ))}
          </ul>
        </nav>

        {/* Footer - Collapse/Expand Button for Desktop */}
        <div className="p-3 border-t border-gray-200 hidden lg:block">
          <motion.button
            onClick={toggleExpanded}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </motion.div>
          </motion.button>
        </div>

        {/* Background blur effect */}
        <div className="absolute inset-0 -z-10 backdrop-blur-md bg-surface-white/95" />
      </motion.div>
    </>
  );
}

export default SideNavigation;
