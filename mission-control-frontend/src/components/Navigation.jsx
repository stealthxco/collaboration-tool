import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, Target, Users, Bot, Settings, 
  BarChart3, Search, FileText, Zap, Upload,
  ChevronDown, Menu, X, Bell, User
} from 'lucide-react'

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      description: 'Overview and key metrics'
    },
    {
      name: 'Missions',
      href: '/missions',
      icon: Target,
      description: 'Mission management and tracking'
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      description: 'Advanced analytics and insights'
    },
    {
      name: 'Advanced Search',
      href: '/search',
      icon: Search,
      description: 'Advanced mission search and filtering'
    },
    {
      name: 'Templates',
      href: '/templates',
      icon: FileText,
      description: 'Mission templates and workflows'
    },
    {
      name: 'Bulk Operations',
      href: '/bulk-operations',
      icon: Target,
      description: 'Batch operations on multiple missions'
    },
    {
      name: 'Workflow Rules',
      href: '/workflow-rules',
      icon: Zap,
      description: 'Automated workflow rules and triggers'
    },
    {
      name: 'File Manager',
      href: '/files',
      icon: Upload,
      description: 'File upload and management'
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FileText,
      description: 'Reporting and scheduled exports'
    },
    {
      name: 'Agents',
      href: '/agents',
      icon: Bot,
      description: 'Agent management and monitoring'
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      description: 'User management and permissions'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'System configuration'
    }
  ]

  const NavItem = ({ item, mobile = false }) => {
    const baseClasses = mobile
      ? "block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
      : "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"

    return (
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          `${baseClasses} ${
            isActive
              ? 'bg-blue-100 text-blue-700 border-blue-500'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
          }`
        }
        onClick={() => mobile && setIsOpen(false)}
      >
        <item.icon className={`${mobile ? 'mr-3' : 'mr-2'} w-5 h-5 flex-shrink-0`} />
        <span>{item.name}</span>
      </NavLink>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Mission Control</h1>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-2">
            {navigationItems.slice(0, 6).map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
            
            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
              >
                More
                <ChevronDown className="ml-1 w-4 h-4" />
              </button>
              
              {isOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {navigationItems.slice(6).map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                          `block px-4 py-2 text-sm transition-colors duration-200 ${
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`
                        }
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex items-center">
                          <item.icon className="mr-3 w-4 h-4" />
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </div>
                        </div>
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50"
              >
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700">Admin</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Your Profile
                    </a>
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Settings
                    </a>
                    <hr className="my-1" />
                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Sign out
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
            {navigationItems.map((item) => (
              <NavItem key={item.name} item={item} mobile />
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(isOpen || isProfileOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false)
            setIsProfileOpen(false)
          }}
        />
      )}
    </nav>
  )
}

export default Navigation