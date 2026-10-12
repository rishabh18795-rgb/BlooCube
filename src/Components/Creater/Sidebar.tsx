'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft,ChevronRight } from 'lucide-react';
import {
  Home,
  FileText,
  BarChart3,
  Users,
  Settings,
  Store,
  LogOut,
  Bell,
  User,
  MessageSquare,
  Briefcase,
  Wallet,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { cookieAuthUtils } from '@/lib/cookieAuth';
import { performLogout } from '@/lib/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getAvatarUrl } from '@/lib/profile';
import LogoutModal from './LogoutModel';

const sidebarItems = [
  { name: 'Dashboard', icon: Home, href: '/creator' },
  { name: 'Find Campaigns', icon: Store, href: '/creator/marketplace' },
  { name: 'My Applications', icon: FileText, href: '/creator/bids' },
  { name: 'Messages', icon: MessageSquare, href: '/creator/messages' },
  { name: 'My Collaborations', icon: Briefcase, href: '/creator/collaborations' },
  { name: 'Payments', icon: Wallet, href: '/creator/payments' },
  { name: 'Analytics', icon: BarChart3, href: '/creator/analytics' },
  { name: 'Notifications', icon: Bell, href: '/creator/notifications' },
  { name: 'My Profile', icon: User, href: '/creator/settings' },
  { name: 'Settings', icon: Settings, href: '/creator/settings' },
];

// This interface is required
interface SidebarProps {
  sidebarOpen: boolean;
   setSidebarOpen: (value: boolean) => void;
}

// Accept the 'sidebarOpen' prop
const Sidebar = React.memo(({ sidebarOpen,setSidebarOpen }: SidebarProps) => { 
  const [user, setUser] = useState<{ name?: string, email?: string, avatar_url?: string } | null>(null);
  const { profile } = useUserProfile();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const userData = cookieAuthUtils.getUser();
    setUser(userData as { name?: string, email?: string, avatar_url?: string } | null);
  }, []);

  const isItemActive = useCallback((item: typeof sidebarItems[0]) => {
    const normalizedPathname = pathname.replace(/\/$/, '').split('?')[0];
    const normalizedHref = item.href.replace(/\/$/, '');
    
    if (normalizedHref === '/creator') {
      return normalizedPathname === '/creator';
    }
    
    return normalizedPathname.startsWith(normalizedHref);
  }, [pathname]);

 
 const [openLogoutModal, setOpenLogoutModal] = useState(false);
 const [userDropdownOpen, setUserDropdownOpen] = useState(false);
 const [loggingOut, setLoggingOut] = useState(false);
 const [logoutError, setLogoutError] = useState<string | null>(null);
  const handleOpenLogoutModal = () => {
     setLogoutError(null);
     setOpenLogoutModal(true);
    };

   const onLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(null);
    const result = await performLogout();
    setLoggingOut(false);
    if (!result.success) {
      setLogoutError(result.error || 'Logout failed. Please try again.');
      return;
    }
    setOpenLogoutModal(false);
    router.push('/login');
  }, [router, loggingOut]);

    
  const getNavItemClasses = (item: typeof sidebarItems[0], isActive: boolean) => {
    const baseClasses = "group relative flex items-center px-4 py-3.5 text-sm font-semibold rounded-md transition-all duration-500 ease-out transform hover:scale-[1.02] hover:shadow-lg";
    const activeClasses = `bg-gradient-to-r from-blue-600 to-purple-600 text-white  shadow-sm  before:absolute before:inset-0 before:rounded-md before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`;
    const inactiveClasses = "text-gray-700 hover:bg-white/80 hover:text-gray-900 hover:shadow-md backdrop-blur-sm border border-transparent hover:border-gray-200/50";
    
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

  const getIconClasses = (item: typeof sidebarItems[0], isActive: boolean) => {
    const baseClasses = "w-5 h-5 transition-all duration-500 ease-out";
    const activeClasses = "text-white drop-shadow-sm";
    const inactiveClasses = `text-gray-500 group-hover:text-gray-600 group-hover:scale-110`;
    
    return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
  };

//   useEffect(() => {
//   if (window.innerWidth < 1024) {
//     // Auto close only on mobile when a link is clicked
//     setSidebarOpen(true);
//   }
// }, [pathname]);

  return (
    // This className controls the mobile slide-in and fixed width
    <>
     <aside 
  className={`${sidebarOpen ? 'lg:w-64' : 'lg:w-20'} 
  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
  lg:translate-x-0 fixed left-0 top-0 z-[9999] w-64 sm:w-72 md:w-80 h-screen
  bg-white/80 backdrop-blur-2xl shadow-2xl border-r border-gray-200/30 flex flex-col
  transition-all duration-500 ease-out`}
>

        <div className="flex items-center justify-between p-3 lg:p-3">

          {/* Logo */}
           <Link href ="/"> 
    <div className="flex items-center gap-2 ">
      <img
        src="/logo.png"
        alt="Bloocube Logo"
        className="w-10 h-10 sm:w-16 sm:h-16 object-contain"
      />
   <span className={`font-bold text-lg sm:text-xl transition-all duration-300 
  ${sidebarOpen ? 'lg:inline' : 'lg:hidden'}`}>
  Bloocube
</span>
            </div>
            
            </Link>

    {/* Close button - only mobile */}
    <button
      onClick={() => setSidebarOpen(false)}
      className="lg:hidden p-2 rounded-lg hover:bg-gray-200 transition"
    >
      ✕
    </button>
        </div>
        
{/* Toggle Button (Desktop only) */}
<div 
  className={`hidden lg:flex transition-all duration-300 
    ${sidebarOpen 
      ? "absolute top-6 right-3"  // ✅ expanded → near logo
      : "flex justify-center mt-4" // ✅ collapsed → below logo
    }`}
>
  <button
    onClick={() => setSidebarOpen(!sidebarOpen)}
    className="p-2 rounded-lg hover:bg-gray-200 transition"
  >
    {sidebarOpen ? (
      <ChevronLeft className="w-5 h-5 text-gray-600" />
    ) : (
      <ChevronRight className="w-5 h-5 text-gray-600" />
    )}
  </button>
</div>


      {/* Navigation */}
<nav className="flex-1 py-1 px-2 lg:py-4 sm:px-4 mt-3 sm:mt-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-100">
        <div className="space-y-2 md:space-y-3 sm:space-y-3">
          {sidebarItems.map(item => {
            const isActive = isItemActive(item);
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                className={getNavItemClasses(item, isActive)}
              >
                <div className="relative">
                  <item.icon className={getIconClasses(item, isActive)} />
                  {isActive && (
                    <div className="absolute bg-gradient-to-r from-blue-600 to-purple-600 bg-white/20 rounded-md blur-sm"></div>
                  )}
                </div>
                <span className="ml-3 md:ml-4 font-medium truncate">{item.name}</span>
                
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-3 md:p-3 lg:hidden">
  <div className="flex items-center gap-3 md:gap-4  ">
    <div className="relative">
            {user === null ? (
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-full flex items-center justify-center animate-pulse">
                <User className="w-6 h-6 md:w-6 md:h-6 text-gray-400" />
              </div>
            ) : getAvatarUrl(profile?.profile?.avatar_url || user?.avatar_url) ? (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
                <Image
                  src={getAvatarUrl(profile?.profile?.avatar_url || user?.avatar_url) || ''}
                  alt={user.name || profile?.name || 'User Avatar'}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-white text-lg md:text-xl font-semibold">
                  {(user.name || profile?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <div className="flex-1 min-w-0">
            {user === null ? (
              <div className="space-y-2">
                <div className="h-3.5 md:h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm md:text-base font-bold text-gray-900 truncate">
                  {user?.name || 'Creator Account'}
                </p>
                <p className="text-xs md:text-sm text-gray-500 truncate font-medium">
                  {user?.email || 'creator@Bloocube.com'}
                </p>
              </div>
            )}
          </div>
          <button  onClick={handleOpenLogoutModal} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-105 group">
            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          
        </div>
      </div>
    </aside>
    {openLogoutModal && (
  <LogoutModal
    open={openLogoutModal}
    onOpenChange={setOpenLogoutModal}
    onConfirm={onLogout}
    loading={loggingOut}
    error={logoutError}
  />
)}
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;