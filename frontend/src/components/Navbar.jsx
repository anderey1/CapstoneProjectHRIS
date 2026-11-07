import { useEffect, useRef } from 'react';
import { Menu, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = ({ toggleDrawer }) => {
  const { logout } = useAuth();
  const accountMenu = useRef(null);

  useEffect(() => {
    const closeOutside = (event) => {
      if (accountMenu.current && !accountMenu.current.contains(event.target)) {
        accountMenu.current.open = false;
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  const closeAccountMenu = () => {
    if (accountMenu.current) accountMenu.current.open = false;
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="flex items-center justify-between gap-4 bg-white border-b border-slate-200/80 px-4 md:px-6 sticky top-0 z-30 h-16 shrink-0">
      <div className="flex min-w-0 items-center gap-2">
        {toggleDrawer && (
          <button
            type="button"
            onClick={toggleDrawer}
            className="btn btn-ghost btn-square min-h-11 min-w-11 lg:hidden text-slate-600 hover:text-slate-900"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden text-xs text-slate-600 md:block">{currentDate}</span>
        <NotificationBell />
        <details
          ref={accountMenu}
          className="relative"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && accountMenu.current?.open) {
              event.preventDefault();
              closeAccountMenu();
              accountMenu.current.querySelector('summary').focus();
            }
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) closeAccountMenu();
          }}
        >
          <summary
            className="btn btn-ghost btn-square min-h-11 min-w-11 list-none text-slate-600 hover:text-slate-900 [&::-webkit-details-marker]:hidden"
            aria-label="Account options"
            title="Account options"
          >
            <UserCircle className="h-5 w-5" aria-hidden="true" />
          </summary>
          <ul className="absolute right-0 top-full z-40 mt-2 w-44 rounded border border-slate-200 bg-white p-1 shadow-md">
            <li>
              <Link to="/profile" onClick={closeAccountMenu} className="flex min-h-11 items-center rounded px-3 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-primary">
                View profile
              </Link>
            </li>
            <li>
              <button type="button" onClick={() => { closeAccountMenu(); logout(); }} className="flex min-h-11 w-full items-center rounded px-3 text-sm text-error hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-primary">
                Logout
              </button>
            </li>
          </ul>
        </details>
      </div>
    </header>
  );
};

export default Navbar;
