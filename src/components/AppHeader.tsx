import { GraduationCap, LogOut, ChevronLeft, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { UserRole } from "../App";
import { useNavigate, useLocation } from "react-router-dom";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface AppHeaderProps {
    currentUser: { id: string; name: string; email: string }
    currentRole: UserRole
    onSignOut: () => void
}

export function AppHeader({
    currentUser,
    currentRole,
    onSignOut
}: AppHeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const roleLabels: Record<UserRole, string> = {
        student: 'Student',
        instructor: 'Clinical Instructor',
        admin: 'Administrator'
    };

    const handleBackToDashboard = () => {
        if (currentRole === 'admin') {
            navigate('/admin/dashboard');
        } else if (currentRole === 'instructor') {
            navigate('/instructor/dashboard');
        } else {
            navigate('/student/dashboard');
        }
    };

    const getNavItems = () => {
        switch (currentRole) {
            case 'student':
                return [
                    { path: '/student/dashboard', label: 'Dashboard' },
                    { path: '/student/logbook', label: 'My Logbook' }
                ];
            case 'instructor':
                return [
                    { path: '/instructor/dashboard', label: 'Dashboard' },
                    { path: '/instructor/review', label: 'Review Entries' }
                ];
            case 'admin':
                return [
                    { path: '/admin/dashboard', label: 'Dashboard' },
                    { path: '/admin/students', label: 'Users' },
                    { path: '/admin/preceptors', label: 'Preceptors' },
                    { path: '/admin/assign', label: 'Assign' },
                    { path: '/admin/review', label: 'Review' }
                ];
            default:
                return [];
        }
    };

    // Determine if we are on a sub-page (not dashboard)
    const isDashboard = location.pathname.endsWith('dashboard');

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">

                {/* Left: Branding & Back Button */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 font-semibold">
                        <img src="/logo.png" alt="Mediatlas" className="h-10 w-10 rounded-lg object-contain" />
                        <span className="hidden md:inline-block text-xl font-bold tracking-tight bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent">Mediatlas</span>
                    </div>

                    {!isDashboard && (
                        <>
                            <div className="h-6 w-px bg-border mx-2" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBackToDashboard}
                                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </>
                    )}
                </div>

                {/* Center: Navigation - visible on desktop */}
                <nav className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
                    {getNavItems().map((item) => (
                        <Button
                            key={item.path}
                            variant={location.pathname === item.path ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => navigate(item.path)}
                            className="text-sm font-medium transition-colors"
                        >
                            {item.label}
                        </Button>
                    ))}
                </nav>

                {/* Right: User Menu */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onSignOut}
                        className="hidden md:flex text-slate-500 hover:text-red-600 hover:bg-red-50"
                        title="Log Out"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-2 hover:bg-slate-100 rounded-lg h-auto py-2">
                                <div className="flex flex-col items-end hidden sm:flex">
                                    <span className="text-sm font-semibold text-slate-700">{currentUser.name}</span>
                                    <span className="text-xs text-slate-500 font-normal">{roleLabels[currentRole]}</span>
                                </div>
                                <Avatar className="h-9 w-9 border border-slate-200">
                                    <AvatarImage src="/avatars/01.png" alt={currentUser.name} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                        {currentUser.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-60 p-2" align="end">
                            <DropdownMenuLabel className="font-normal p-2">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                                    <p className="text-sm leading-none text-muted-foreground">
                                        {currentUser.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    onSignOut();
                                }}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50 py-2 cursor-pointer"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Mobile Nav Bar */}
            <div className="md:hidden border-t px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
                {getNavItems().map((item) => (
                    <Button
                        key={item.path}
                        variant={location.pathname === item.path ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => navigate(item.path)}
                        className="text-sm font-medium whitespace-nowrap"
                    >
                        {item.label}
                    </Button>
                ))}
            </div>
        </header >
    );
}
