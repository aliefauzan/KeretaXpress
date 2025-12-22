'use client';

import React from 'react';
import Link from 'next/link';
import { FaTrain } from 'react-icons/fa';

interface NavbarLogoProps {
  isScrolled: boolean;
}

const NavbarLogo: React.FC<NavbarLogoProps> = ({ isScrolled }) => {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <div className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 ${
        isScrolled 
          ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
          : 'bg-white/20 backdrop-blur-sm border border-white/30'
      }`}>
        <FaTrain className={`text-xl transition-all duration-300 ${
          isScrolled ? 'text-white' : 'text-white'
        } group-hover:animate-pulse`} />
      </div>
      <div className="hidden sm:block">
        <h1 className={`text-xl font-bold transition-all duration-300 ${
          isScrolled ? 'text-gray-800' : 'text-white'
        }`}>
          KeretaXpress
        </h1>
        <p className={`text-xs transition-all duration-300 ${
          isScrolled ? 'text-gray-500' : 'text-blue-100'
        }`}>
          Fast & Reliable
        </p>
      </div>
    </Link>
  );
};

export default NavbarLogo;
