import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, Store, AlertTriangle, ClipboardList, Navigation as NavigationIcon, Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const NavContent = () => (
    <>
      <div className="p-6 flex justify-between items-center">
        <img
          className="h-8 w-auto"
          src="https://asut.az/img/styleswitcher/logos/logos-dark/yellow.png"
          alt="asutsystem"
        />
        <button className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(false)}>
          <X className="h-6 w-6" />
        </button>
      </div>
      <nav className="mt-6">
        <Link 
          to="/dashboard" 
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 border-l-4 ${isActive('/dashboard') ? 'border-indigo-500 bg-gray-50' : 'border-transparent hover:border-indigo-500'}`}
        >
          <LayoutDashboard className="h-5 w-5 mr-3" />
          {t('dashboard')}
        </Link>
        {user?.role === 'admin' && (
          <Link 
            to="/admin" 
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 border-l-4 ${isActive('/admin') ? 'border-indigo-500 bg-gray-50' : 'border-transparent hover:border-indigo-500'}`}
          >
            <User className="h-5 w-5 mr-3" />
            {t('usersRoles')}
          </Link>
        )}
        <Link 
          to="/admin/kiosks" 
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 border-l-4 ${isActive('/admin/kiosks') ? 'border-indigo-500 bg-gray-50' : 'border-transparent hover:border-indigo-500'}`}
        >
          <Store className="h-5 w-5 mr-3" />
          {t('kiosks')}
        </Link>
        <Link 
          to="/admin/problem-types" 
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 border-l-4 ${isActive('/admin/problem-types') ? 'border-indigo-500 bg-gray-50' : 'border-transparent hover:border-indigo-500'}`}
        >
          <AlertTriangle className="h-5 w-5 mr-3" />
          {t('problemTypes')}
        </Link>
        <Link 
          to="/admin/visit-types" 
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 border-l-4 ${isActive('/admin/visit-types') ? 'border-indigo-500 bg-gray-50' : 'border-transparent hover:border-indigo-500'}`}
        >
          <ClipboardList className="h-5 w-5 mr-3" />
          {t('visitTypes')}
        </Link>
        <Link 
          to="/admin/reports" 
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 border-l-4 ${isActive('/admin/reports') ? 'border-indigo-500 bg-gray-50' : 'border-transparent hover:border-indigo-500'}`}
        >
          <ClipboardList className="h-5 w-5 mr-3" />
          {t('mansionVisitReport')}
        </Link>
        <Link 
          to="/visit-form" 
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 border-l-4 ${isActive('/visit-form') ? 'border-indigo-500 bg-gray-50' : 'border-transparent hover:border-indigo-500'}`}
        >
          <ClipboardList className="h-5 w-5 mr-3" />
          {t('mansionVisitForm')}
        </Link>
        <Link 
          to="/map" 
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 border-l-4 ${isActive('/map') ? 'border-indigo-500 bg-gray-50' : 'border-transparent hover:border-indigo-500'}`}
        >
          <NavigationIcon className="h-5 w-5 mr-3" />
          {t('map')}
        </Link>
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Desktop Sidebar */}
      <div className="w-64 bg-white shadow-lg hidden lg:block flex-shrink-0">
        <NavContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white shadow-xl z-50">
            <NavContent />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center">
            <button
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 mr-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 truncate">{t('adminPanel')}</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSwitcher />
            <div className="hidden sm:flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">{user?.username}</span>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-red-600 p-1">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
