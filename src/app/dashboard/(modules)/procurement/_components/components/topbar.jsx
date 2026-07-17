import * as ReactRouter from 'react-router';
import { useRef, useState, useEffect } from 'react';
import { Bell, User, Search, LogOut, Settings, ChevronDown } from 'lucide-react';

import { useAuth } from '../contexts/auth-context';
const useNavigate = ReactRouter.useNavigate || ReactRouter.default?.useNavigate;
export function Topbar({ title = 'Dashboard', breadcrumbs = ['Home', 'Dashboard'] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleLogout = () => {
    logout();
    navigate('/auth/internal-login');
  };
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center">
              {index > 0 && <span className="mx-2">/</span>}
              <span
                className={index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}
              >
                {crumb}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-80 pl-10 pr-4 py-2 bg-secondary rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button className="relative p-2 hover:bg-secondary rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>

        <div className="flex items-center gap-2 pl-4 border-l border-border">
          <select className="text-sm border border-input rounded-lg px-3 py-1.5 bg-card cursor-pointer">
            <option>Dhaka Head Office</option>
            <option>Cox's Bazar Regional</option>
            <option>Rajshahi Field Office</option>
          </select>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 hover:bg-secondary px-3 py-2 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
              {user?.avatar || 'AD'}
            </div>
            <div className="text-left hidden xl:block">
              <p className="text-sm font-medium leading-tight">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-muted-foreground">{user?.designation || 'Admin'}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <div className="p-1">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md transition-colors">
                  <User className="w-4 h-4" />
                  <span>My Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md transition-colors">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </div>
              <div className="p-1 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
