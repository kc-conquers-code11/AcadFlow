import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  Laptop,
  ShieldCheck,
  Search
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"; // Make sure you have shadcn command or use standard dialog
// NOTE: Agar shadcn ka "command" installed nahi hai, toh bata, main standard Dialog wala version deta hu.
// Assuming you might NOT have the specific 'cmdk' package installed, I will give you a version using standard Dialog + Input logic which is safer.

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { logout, user } = useAuth();

  // Toggle with Keyboard Shortcut (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  // Define Actions
  const actions = [
    // Navigation
    { title: "Dashboard", icon: LayoutDashboard, action: () => navigate("/dashboard"), role: "all" },
    { title: "Assignments", icon: Calculator, action: () => navigate("/assignments"), role: "all" },
    { title: "Settings", icon: Settings, action: () => navigate("/settings"), role: "all" },
    { title: "Support", icon: Smile, action: () => navigate("/support"), role: "all" },
    
    // Admin Specific
    { title: "God Console", icon: ShieldCheck, action: () => navigate("/admin"), role: "admin" },
    { title: "Manage Users", icon: User, action: () => navigate("/users"), role: "admin" },

    // Actions
    { title: "Toggle Dark Mode", icon: Moon, action: () => setTheme("dark"), role: "all" },
    { title: "Toggle Light Mode", icon: Sun, action: () => setTheme("light"), role: "all" },
    { title: "Logout", icon: LogOut, action: () => logout(), role: "all" },
  ];

  const filteredActions = actions.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) && 
    (item.role === 'all' || item.role === user?.role)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden shadow-2xl max-w-[550px] border border-border top-[20%] translate-y-0">
        <div className="flex items-center border-b px-4" cmdk-input-wrapper="">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="text-xs text-muted-foreground border px-1.5 py-0.5 rounded bg-muted">ESC</div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredActions.length === 0 && (
            <p className="p-4 text-sm text-center text-muted-foreground">No results found.</p>
          )}
          
          <div className="space-y-1">
            {/* Group Logic can be added here */}
            <p className="px-2 text-xs font-medium text-muted-foreground mb-2 mt-2">Suggestions</p>
            
            {filteredActions.map((item, index) => (
              <button
                key={index}
                onClick={() => runCommand(item.action)}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-md hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors text-left"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{item.title}</span>
                {item.title.includes("Dashboard") && <span className="text-xs text-muted-foreground font-mono">Home</span>}
              </button>
            ))}
          </div>
        </div>
        
        <div className="border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground flex justify-between">
            <span>Pro Tip: Use arrow keys to navigate (coming soon)</span>
            <span className="font-mono">AcadFlow v1.0</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}