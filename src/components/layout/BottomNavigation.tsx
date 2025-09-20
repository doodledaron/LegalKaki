'use client'

import { motion } from 'framer-motion'
import { Home, MessageCircle, Bookmark, User } from 'lucide-react'
import { NavItem } from '@/types'

interface BottomNavigationProps {
  activeRoute: string
  onNavigate: (route: string) => void
}

export function BottomNavigation({ activeRoute, onNavigate }: BottomNavigationProps) {
  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      route: '/',
      isActive: activeRoute === '/' || activeRoute === 'welcome'
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: 'message-circle',
      route: '/chat',
      isActive: activeRoute === '/chat' || activeRoute === 'chat' || activeRoute === 'domain-selection'
    },
    {
      id: 'collection',
      label: 'Collection',
      icon: 'bookmark',
      route: '/collection',
      isActive: activeRoute === '/collection' || activeRoute === 'collection'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'user',
      route: '/profile',
      isActive: activeRoute === '/profile' || activeRoute === 'profile'
    }
  ]

  const getIcon = (iconName: string, isActive: boolean) => {
    const iconProps = {
      className: `w-5 h-5 transition-colors duration-200 ${
        isActive ? 'text-purple-primary' : 'text-text-secondary'
      }`,
    }

    switch (iconName) {
      case 'home':
        return <Home {...iconProps} />
      case 'message-circle':
        return <MessageCircle {...iconProps} />
      case 'bookmark':
        return <Bookmark {...iconProps} />
      case 'user':
        return <User {...iconProps} />
      default:
        return <Home {...iconProps} />
    }
  }

  const handleNavClick = (item: NavItem) => {
    // Map bottom nav routes to app screen states
    switch (item.id) {
      case 'home':
        onNavigate('welcome')
        break
      case 'chat':
        onNavigate('domain-selection')
        break
      case 'collection':
        onNavigate('collection')
        break
      case 'profile':
        onNavigate('profile')
        break
      default:
        onNavigate('welcome')
    }
  }

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface-white border-t border-gray-200 px-4 py-3 safe-area-pb"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item, index) => (
          <motion.button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl min-w-[60px] transition-all duration-200 ${
              item.isActive 
                ? 'bg-purple-subtle' 
                : 'bg-transparent hover:bg-gray-50'
            }`}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              duration: 0.3, 
              delay: index * 0.1,
              ease: 'easeOut'
            }}
          >
            <motion.div
              animate={item.isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {getIcon(item.icon, item.isActive || false)}
            </motion.div>
            
            <motion.span 
              className={`text-xs font-medium mt-1 transition-colors duration-200 ${
                item.isActive ? 'text-purple-primary' : 'text-text-secondary'
              }`}
              animate={item.isActive ? { y: [0, -2, 0] } : { y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {item.label}
            </motion.span>

            {/* Active indicator */}
            {item.isActive && (
              <motion.div
                className="absolute -top-1 left-1/2 w-1 h-1 bg-purple-primary rounded-full"
                layoutId="activeIndicator"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.4 }}
                style={{ transform: 'translateX(-50%)' }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Background blur effect */}
      <div className="absolute inset-0 -z-10 backdrop-blur-md bg-surface-white/80" />
    </motion.div>
  )
}

export default BottomNavigation
