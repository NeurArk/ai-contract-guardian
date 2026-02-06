'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import {
  Shield,
  LayoutDashboard,
  FileText,
  Upload,
  User,
  LogOut,
  Menu,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/contracts', label: 'Mes contrats', icon: FileText },
  { href: '/contracts/upload', label: 'Nouvelle analyse', icon: Upload },
  { href: '/account', label: 'Mon compte', icon: User },
];

const legalItems = [
  { href: '/legal/cgu', label: 'CGU', icon: FileText },
  { href: '/legal/privacy', label: 'Confidentialité', icon: Shield },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900 hidden sm:block">
              AI Contract Guardian
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3 text-sm">
                {legalItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`transition-colors ${
                      pathname.startsWith(item.href)
                        ? 'text-slate-900'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {user?.email ? (
                <>
                  <span className="text-sm text-slate-600">{user.email}</span>
                  <Button variant="ghost" size="icon" onClick={logout} aria-label="Déconnexion">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Connexion
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-6 mt-8">
                  <div className="flex items-center gap-2 px-2">
                    <User className="h-5 w-5 text-slate-400" />
                    <span className="text-sm text-slate-600 truncate">
                      {user?.email ?? 'Non connecté'}
                    </span>
                  </div>

                  <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={pathname === item.href ? 'default' : 'ghost'}
                          className="w-full justify-start"
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </nav>

                  <div className="pt-4 border-t">
                    <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Légal</p>
                    <div className="flex flex-col gap-2">
                      {legalItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                          <Button
                            variant={pathname.startsWith(item.href) ? 'default' : 'ghost'}
                            className="w-full justify-start"
                          >
                            <item.icon className="h-4 w-4 mr-2" />
                            {item.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {user?.email ? (
                    <Button variant="outline" onClick={logout} className="w-full">
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnexion
                    </Button>
                  ) : (
                    <Link href="/login">
                      <Button variant="outline" className="w-full">
                        Connexion
                      </Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
