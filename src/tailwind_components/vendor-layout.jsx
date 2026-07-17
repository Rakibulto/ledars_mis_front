import { useState } from 'react';
import * as ReactRouter from 'react-router';
import {
  User,
  Bell,
  Send,
  List,
  Award,
  Truck,
  Store,
  Shield,
  LogOut,
  FileText,
  UserPlus,
  Clipboard,
  DollarSign,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';

import { useAuth } from '../contexts/auth-context';

const Link = ReactRouter.Link || ReactRouter.default?.Link;
const useLocation = ReactRouter.useLocation || ReactRouter.default?.useLocation;
const useNavigate = ReactRouter.useNavigate || ReactRouter.default?.useNavigate;
const Outlet = ReactRouter.Outlet || ReactRouter.default?.Outlet;
const vendorMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/vendor-portal/dashboard' },
  { id: 'profile', label: 'My Profile', icon: User, path: '/vendor-portal/profile' },
  {
    id: 'rfqs',
    label: 'RFQ & Proposals',
    icon: FileText,
    subItems: [
      { id: 'rfq-list', label: 'Available RFQs', path: '/vendor-portal/rfqs', icon: List },
      { id: 'my-quotations', label: 'My Proposals', path: '/vendor-portal/quotations', icon: Send },
    ],
  },
  { id: 'awards', label: 'My Awards', icon: Award, path: '/vendor-portal/awards' },
  {
    id: 'work-orders',
    label: 'Work Orders',
    icon: Clipboard,
    subItems: [
      { id: 'wo-list', label: 'Work Order List', path: '/vendor-portal/work-orders', icon: List },
      { id: 'wo-delivery', label: 'Delivery & GRN', path: '/vendor-portal/delivery', icon: Truck },
    ],
  },
  { id: 'payments', label: 'Payments', icon: DollarSign, path: '/vendor-portal/payments' },
  { id: 'documents', label: 'My Documents', icon: FolderOpen, path: '/vendor-portal/documents' },
  {
    id: 'enlistment',
    label: 'Enlistment Status',
    icon: UserPlus,
    path: '/vendor-portal/enlistment',
  },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/vendor-portal/notifications' },
];
function VendorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState([]);
  const toggleExpanded = (itemId) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };
  const isPathActive = (path) => location.pathname === path;
  const isParentActive = (item) => {
    if (item.path && isPathActive(item.path)) return true;
    if (item.subItems) return item.subItems.some((s) => location.pathname.startsWith(s.path));
    return false;
  };
  const handleLogout = () => {
    logout();
    navigate('/auth/vendor-login');
  };
  return (
    <aside className="w-64 bg-emerald-900 h-screen flex flex-col">
      <div className="p-6 border-b border-emerald-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Store className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Vendor Portal</h1>
            <p className="text-[10px] text-emerald-300">Ledars NGO</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {vendorMenuItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItems.includes(item.id);
            const isActive = isParentActive(item);
            return (
              <li key={item.id}>
                {hasSubItems ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-emerald-700 text-white' : 'text-emerald-200 hover:bg-emerald-800'}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {item.subItems.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = isPathActive(sub.path);
                          return (
                            <li key={sub.id}>
                              <Link
                                to={sub.path}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isSubActive ? 'bg-white text-emerald-900 font-semibold' : 'text-emerald-200 hover:bg-emerald-800'}`}
                              >
                                {SubIcon && <SubIcon className="w-4 h-4" />}
                                <span>{sub.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-white text-emerald-900 font-semibold' : 'text-emerald-200 hover:bg-emerald-800'}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 2FA indicator */}
      <div className="px-4 py-2 border-t border-emerald-700">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-800 rounded-lg">
          <Shield className="w-4 h-4 text-emerald-300" />
          <span className="text-[11px] text-emerald-300">2FA Enabled &middot; Secure Session</span>
        </div>
      </div>

      {/* User + Logout */}
      <div className="p-4 border-t border-emerald-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-white text-emerald-900 flex items-center justify-center text-sm font-semibold">
            {user?.avatar || 'V'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.companyName || 'Vendor'}
            </p>
            <p className="text-[10px] text-emerald-300 truncate">{user?.name || 'Vendor User'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-300 hover:bg-red-900/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
// Vendor-specific topbar
function VendorTopbar() {
  const location = useLocation();
  const { user } = useAuth();
  const pageTitles = {
    '/vendor-portal': 'Dashboard',
    '/vendor-portal/dashboard': 'Dashboard',
    '/vendor-portal/profile': 'My Profile',
    '/vendor-portal/rfqs': 'Available RFQs',
    '/vendor-portal/quotations': 'My Proposals',
    '/vendor-portal/awards': 'My Awards',
    '/vendor-portal/work-orders': 'Work Orders',
    '/vendor-portal/delivery': 'Delivery & GRN',
    '/vendor-portal/payments': 'Payments',
    '/vendor-portal/documents': 'My Documents',
    '/vendor-portal/notifications': 'Notifications',
    '/vendor-portal/enlistment': 'Enlistment Status',
  };
  const title = pageTitles[location.pathname] || 'Vendor Portal';
  return (
    <header className="h-14 bg-white border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Vendor Portal</span>
        <span>/</span>
        <span className="text-foreground font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to="/vendor-portal/notifications"
          className="relative p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Link>
        <div className="flex items-center gap-2 pl-3 border-l border-border text-sm">
          <span className="text-muted-foreground">{user?.companyName}</span>
          <span className="text-xs text-emerald-600 font-semibold">
            ({user?.vendorId || 'V001'})
          </span>
        </div>
      </div>
    </header>
  );
}
export function VendorLayout() {
  return (
    <div className="size-full flex bg-background">
      <VendorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <VendorTopbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
