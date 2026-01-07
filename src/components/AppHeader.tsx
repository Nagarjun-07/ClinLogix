import { GraduationCap, LogOut, ChevronLeft, UserCog, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { UserRole } from "../App";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface AppHeaderProps {
    currentUser: { id: string; name: string; email: string }
    currentRole: UserRole
    onRoleChange: (role: UserRole) => void
    currentView: string
    onViewChange: (view: string) => void
    onSignOut: () => void
}

export function AppHeader({
    currentUser,
    currentRole,
    onRoleChange,
    currentView,
    onViewChange,
    onSignOut
}: AppHeaderProps) {

    const roleLabels: Record<UserRole, string> = {
        student: 'Student',
        instructor: 'Clinical Instructor',
        admin: 'Administrator'
    };

    const handleBackToDashboard = () => {
        if (currentRole === 'admin') {
            onViewChange('admin-dashboard');
        } else {
            onViewChange('dashboard');
        }
    };

    const getNavItems = () => {
        switch (currentRole) {
            case 'student':
                return [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'logbook', label: 'My Logbook' }
                ];
            case 'instructor':
                return [
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'review', label: 'Review Entries' }
                ];
            case 'admin':
                return [
                    { id: 'admin-dashboard', label: 'Dashboard' },
                    { id: 'admin-students', label: 'Users' },
                    { id: 'admin-preceptors', label: 'Preceptors' },
                    { id: 'admin-assign', label: 'Assign' },
                    { id: 'admin-lock', label: 'Lock' }
                ];
            default:
                return [];
        }
    };

    const isSubPage = currentView !== 'dashboard' && currentView !== 'admin-dashboard';

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4">

                {/* Left: Branding & Back Button */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 font-semibold">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <GraduationCap className="size-5" />
                        </div>
                        <span className="hidden md:inline-block">Clinical Logbook</span>
                    </div>

                    {isSubPage && (
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
                            key={item.id}
                            variant={currentView === item.id ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => onViewChange(item.id)}
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
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {currentUser.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="my-1" />

                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="py-2 cursor-pointer">
                                    <UserCog className="mr-2 h-4 w-4" />
                                    <span>Switch Role</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    {(['student', 'instructor', 'admin'] as UserRole[]).map((role) => (
                                        <DropdownMenuItem
                                            key={role}
                                            onClick={() => onRoleChange(role)}
                                            className={`cursor-pointer ${currentRole === role ? "bg-accent" : ""}`}
                                        >
                                            <span>{roleLabels[role]}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

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

            {/* Mobile Nav Bar - Bottom or below header? 
                 For simplicity in this refactor, adding a secondary row for mobile if needed, 
                 or relying on centered nav to wrap. Let's start with a simple scrollable row for mobile. 
             */}
            <div className="md:hidden border-t px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
                {getNavItems().map((item) => (
                    <Button
                        key={item.id}
                        variant={currentView === item.id ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => onViewChange(item.id)}
                        className="text-sm font-medium whitespace-nowrap"
                    >
                        {item.label}
                    </Button>
                ))}
            </div>
        </header >
    );
}
