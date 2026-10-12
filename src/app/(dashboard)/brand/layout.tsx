"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  Settings,
  FileText,
  BarChart3,
  LogOut,
} from "lucide-react";
import Sidebar from "@/Components/Brand/Sidebar";
import NotificationDropdown from "@/Components/Brand/NotificationDropdown";
import { useRouter } from "next/navigation";
import { performLogout } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import HeaderRow from "@/Components/layout/HeaderRow";
import LogoutModal from "@/Components/Creater/LogoutModel";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/profile";

interface BrandLayoutProps {
  children: React.ReactNode;
}

const UserInfo = React.memo(
  ({
    user,
    onLogoutClick,
  }: {
    user: Record<string, unknown> | null;
    onLogoutClick: () => void;
  }) => {
    const { profile: userProfile } = useUserProfile();

    if (!user) return null;

    try {
      const profileAvatar = userProfile?.profile?.avatar_url;
      const userProfileAvatar = (user.profile as { avatar_url?: string } | undefined)?.avatar_url;
      const rawAvatarUrl = profileAvatar || userProfileAvatar;
      const avatarUrl = rawAvatarUrl ? getAvatarUrl(rawAvatarUrl) : null;
      const userName =
        userProfile?.name ||
        (user.name as string) ||
        (user.email as string) ||
        "Creator Account";
      const firstLetter = userName.charAt(0).toUpperCase();

      return (
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <div className="w-12 h-12 relative rounded-full overflow-hidden shadow-lg border-2 border-gray-200 bg-gray-100">
                <Image
                  src={avatarUrl}
                  alt={userName}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div className="hidden absolute inset-0 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full items-center justify-center">
                  <span className="text-white text-lg font-semibold">
                    {firstLetter}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-semibold">
                  {firstLetter}
                </span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-500 truncate font-medium">
              {userProfile?.email ||
                (user.email as string) ||
                "creator@Bloocube.com"}
            </p>
          </div>

          <button
            onClick={onLogoutClick}
            onTouchStart={onLogoutClick}
            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110 group"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      );
    } catch (error) {
      console.error("Error rendering UserInfo:", error);
      const userName =
        (user.name as string) || (user.email as string) || "Creator Account";
      const firstLetter = userName.charAt(0).toUpperCase();

      return (
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-semibold">
                {firstLetter}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-500 truncate font-medium">
              {(user.email as string) || "creator@Bloocube.com"}
            </p>
          </div>

          <button
            onClick={onLogoutClick}
            className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      );
    }
  }
);
UserInfo.displayName = "UserInfo";

const BrandLayout: React.FC<BrandLayoutProps> = ({
  children,
}) => {
  const title = "Brand Dashboard";
  const subtitle = "Welcome back! Here's your content overview";
  const headerActions = null;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const router = useRouter();

  const handleOpenLogoutModal = () => {
    setUserDropdownOpen(false);
    setLogoutError(null);
    setOpenLogoutModal(true);
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(null);
    const result = await performLogout();
    setLoggingOut(false);
    if (!result.success) {
      setLogoutError(result.error || "Logout failed. Please try again.");
      return;
    }
    setOpenLogoutModal(false);
    setUserDropdownOpen(false);
    router.push("/login");
  };

  const displayName =
    profile?.name ||
    ((user as Record<string, unknown>)?.name as string) ||
    ((user as Record<string, unknown>)?.email as string) ||
    "Creator Account";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);

  return (
    <>
      <div className="min-h-screen">
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <button
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        {/* Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main layout */}
        <div className={`
    transition-all duration-500 
    ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
    flex flex-col min-h-screen
  `}>
          {/* Mobile Header */}
          <div className="lg:hidden bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200 px-3 py-2 flex items-center justify-between sticky top-0 z-[50]">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <NotificationDropdown />
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200"
                >
                  {profile && getAvatarUrl(profile.profile?.avatar_url) ? (
                    <Image
                      src={getAvatarUrl(profile.profile?.avatar_url) || ""}
                      alt={profile?.name || "User"}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>

                {/* Mobile Dropdown */}
                {userDropdownOpen && (
                  <div className="fixed top-14 left-1/2 -translate-x-1/2 sm:absolute sm:right-0 sm:left-auto sm:translate-x-0 w-[92vw] sm:w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-[99999] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 bg-gradient-to-br from-white via-blue-50 to-indigo-50 border-b border-gray-200">
                      <UserInfo user={user || null} onLogoutClick={handleOpenLogoutModal} />
                    </div>
                    <div className="py-1">
                      <a href="/creator/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                        <Settings className="w-4 h-4" /> Settings
                      </a>
                      <a href="/creator/bids" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                        <FileText className="w-4 h-4" /> My Bids
                      </a>
                      <a href="/creator/analytics" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                        <BarChart3 className="w-4 h-4" /> Analytics
                      </a>
                      <hr className="my-1 border-gray-200" />
                      <button
                        onTouchStart={handleOpenLogoutModal}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Header */}
        <div className="hidden lg:block bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-[50] transition-all duration-500">

            <div className="px-5 py-3">
              <HeaderRow
                left={
                  <div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {title}
                    </h2>
                    <p className="text-xs text-gray-500">{subtitle}</p>
                  </div>
                }
                right={
                  <div className="flex items-center space-x-2">
                    <NotificationDropdown />
                    {headerActions}
                    <div className="relative" ref={userDropdownRef}>
                      <div
                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                        className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200 cursor-pointer"
                      >
                        {profile && getAvatarUrl(profile.profile?.avatar_url) ? (
                          <Image
                            src={getAvatarUrl(profile.profile.avatar_url) || ""}
                            alt={profile.name || "User"}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {userDropdownOpen && (
                        <div className="absolute right-0 mt-5 w-72 rounded-xl bg-white border border-gray-200 shadow-lg z-[10000] overflow-hidden">
                          <div className="p-4 bg-gradient-to-br from-white via-blue-50 to-indigo-50 border-b border-gray-200">
                            <UserInfo user={user || null} onLogoutClick={handleOpenLogoutModal} />
                          </div>
                          <div className="py-1">
                            <a href="/creator/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50">
                              <Settings className="w-4 h-4" /> Settings
                            </a>
                            <a href="/creator/bids" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50">
                              <FileText className="w-4 h-4" /> My Bids
                            </a>
                            <a href="/creator/analytics" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50">
                              <BarChart3 className="w-4 h-4" /> Analytics
                            </a>
                            <hr className="my-1 border-gray-200" />
                            <button
                              onClick={handleOpenLogoutModal}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 font-medium hover:bg-red-50"
                            >
                              <LogOut className="w-4 h-4" /> Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 lg:p-5 relative">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </div>
      </div>

      <LogoutModal
        open={openLogoutModal}
        onOpenChange={setOpenLogoutModal}
        onConfirm={handleLogout}
        loading={loggingOut}
        error={logoutError}
      />
    </>
  );
};

export default BrandLayout;
