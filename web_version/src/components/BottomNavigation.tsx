'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HomeIcon, 
  ClockIcon, 
  TicketIcon, 
  UserCircleIcon 
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ClockIcon as ClockIconSolid,
  TicketIcon as TicketIconSolid,
  UserCircleIcon as UserCircleIconSolid
} from '@heroicons/react/24/solid';

const BottomNavigation = () => {
  const { user, logout } = useAuth();
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      setShowAccountDialog(false);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAccountClick = () => {
    if (user) {
      setShowAccountDialog(!showAccountDialog);
    } else {
      router.push('/login');
    }
  };

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navItems = [
    {
      label: 'BERANDA',
      path: '/',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
      isActive: isActiveRoute('/')
    },    {
      label: 'JADWAL',
      path: '/schedule',
      icon: ClockIcon,
      iconSolid: ClockIconSolid,
      isActive: isActiveRoute('/schedule')
    },
    {
      label: 'RIWAYAT',
      path: '/booking-history',
      icon: TicketIcon,
      iconSolid: TicketIconSolid,
      isActive: isActiveRoute('/booking-history')
    },
    {
      label: 'AKUN',
      path: '#',
      icon: UserCircleIcon,
      iconSolid: UserCircleIconSolid,
      isActive: showAccountDialog,
      onClick: handleAccountClick
    }
  ];

  return (
    <>      {/* Account Dialog/Modal */}
      {showAccountDialog && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all duration-200 animate-scale-in">
            <div className="text-center mb-6">
              <UserCircleIconSolid className="w-16 h-16 mx-auto text-primary mb-3" />
              <h3 className="text-lg font-semibold text-gray-800 truncate">{user.name}</h3>
              <p className="text-gray-600 text-sm truncate">{user.email}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full py-2 px-4 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              >
                Keluar
              </button>
              <button
                onClick={() => setShowAccountDialog(false)}
                className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}      {/* Wave Divider */}
      <div className="fixed bottom-16 left-0 right-0 z-40 pointer-events-none">
        <svg
          className="w-full h-20"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,20 C150,60 350,0 500,20 C650,60 850,0 1000,20 C1150,60 1350,0 1440,20 L1440,100 L0,100 Z"
            fill="white"
            className="drop-shadow-md"
          />
        </svg>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-lg z-50">
        <div className="flex justify-around items-center py-2 px-4">
          {navItems.map((item) => {
            const IconComponent = item.isActive ? item.iconSolid : item.icon;
            
            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`group flex flex-col items-center justify-center py-2 px-3 min-w-0 transition-colors ${
                    item.isActive 
                      ? 'text-primary' 
                      : 'text-gray-500 hover:text-primary'
                  }`}
                >
                  <IconComponent className={`w-6 h-6 mb-1 transition-all duration-300 ease-out ${
                    item.isActive 
                      ? 'scale-125 -translate-y-1 drop-shadow-md' 
                      : 'group-hover:scale-110'
                  }`} />
                  <span className={`text-xs transition-all duration-300 ${
                    item.isActive ? 'font-bold translate-y-0.5' : 'font-medium'
                  }`}>{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.path}
                className={`group flex flex-col items-center justify-center py-2 px-3 min-w-0 transition-colors ${
                  item.isActive 
                    ? 'text-primary' 
                    : 'text-gray-500 hover:text-primary'
                }`}
              >
                <IconComponent className={`w-6 h-6 mb-1 transition-all duration-300 ease-out ${
                  item.isActive 
                    ? 'scale-125 -translate-y-1 drop-shadow-md' 
                    : 'group-hover:scale-110'
                }`} />
                <span className={`text-xs transition-all duration-300 ${
                  item.isActive ? 'font-bold translate-y-0.5' : 'font-medium'
                }`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-20"></div>
    </>
  );
};

export default BottomNavigation;
