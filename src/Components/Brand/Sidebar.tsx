"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Briefcase, Home, Settings, Users, Store, BarChart3, User, LogOut, MessageSquare, Wallet } from 'lucide-react';
import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { performLogout } from '@/lib/auth';
import { getAvatarUrl } from '@/lib/profile';
import LogoutModal from '../Creater/LogoutModel';
import { ChevronLeft,ChevronRight } from 'lucide-react';
import { useCallback } from 'react';
interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
}

const nav = [
  { name: 'Dashboard', href: '/brand', icon: Home },
  { name: 'Campaigns', href: '/brand/campaigns', icon: Briefcase },
  { name: 'Applications', href: '/brand/bids', icon: Users },
  { name: 'Messages', href: '/brand/messages', icon: MessageSquare },
  { name: 'Payments', href: '/brand/payments', icon: Wallet },
  { name: 'Analytics', href: '/brand/analytics', icon: BarChart3 },
  { name: 'Notifications', href: '/brand/notifications', icon: Bell },
  { name: 'Brand Profile', href: '/brand/settings', icon: User },
  { name: 'Settings', href: '/brand/settings', icon: Settings }
];

const getNavItemClasses = (item: typeof nav[0], isActive: boolean) => {
  const baseClasses = "group relative flex items-center px-4 py-3.5 text-sm font-semibold rounded-md transition-all duration-500 ease-out transform hover:scale-[1.02] hover:shadow-lg";
  const activeClasses = `bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-sm  before:absolute before:inset-0 before:rounded-sm before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300`;
  const inactiveClasses = "text-gray-700 hover:bg-white/80 hover:text-gray-900 hover:shadow-md backdrop-blur-sm border border-transparent hover:border-gray-200/50";
  return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
};

const getIconClasses = (item: typeof nav[0], isActive: boolean) => {
  const baseClasses = "w-5 h-5 transition-all duration-500 ease-out";
  const activeClasses = "text-white drop-shadow-sm";
  const inactiveClasses = `text-gray-500 group-hover:text-gray-600 group-hover:scale-110`;
  return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
};

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen ,setSidebarOpen}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile();

  const [openLogoutModal, setOpenLogoutModal] = useState(false);
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
  
  return (
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

  {/* Nav */}
  <nav className="flex-1 py-3 px-2 sm:px-4 mt-3 sm:mt-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-100">
    <div className="space-y-2 sm:space-y-3">
      {nav.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/brand' && pathname.startsWith(item.href));
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
            <span className="ml-3 text-sm sm:text-base font-medium truncate">
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  </nav>

      <div className="p-3 md:p-3 lg:hidden">
  <div className="flex items-center gap-3 md:gap-4 p-3 ">
    <div className="relative">
      {profileLoading ? (
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center animate-pulse">
          <User className="w-6 h-6 text-gray-400" />
        </div>
      ) : profile && getAvatarUrl(profile.profile?.avatar_url) ? (
        <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 border-2 border-gray-200">
          <Image src={getAvatarUrl(profile.profile?.avatar_url) || ''} alt={profile?.name || 'User Avatar'} width={48} height={48} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
          <span className="text-white text-xl font-semibold">
            {(profile?.name || 'B').charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
    </div>
    <div className="flex-1 min-w-0">
      {profileLoading ? (
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
      ) : profileError ? (
        <div className="space-y-1">
          <p className="text-sm font-bold text-gray-900 truncate">Brand Account</p>
          <p className="text-xs text-red-500 truncate font-medium">Error loading profile</p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-sm font-bold text-gray-900 truncate">{profile?.name || 'Brand Account'}</p>
          <p className="text-xs text-gray-500 truncate font-medium">{profile?.email || 'brand@Bloocube.com'}</p>
        </div>
      )}
    </div>
    <button onClick={handleOpenLogoutModal} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110 group">
      <LogOut className="w-5 h-5" />
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
};

export default Sidebar;


