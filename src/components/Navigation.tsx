import { Link, useLocation } from "react-router-dom";
import { Book, BookA, Languages, Settings, FileText, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const Navigation = () => {
  const location = useLocation();

  const links = [
    { to: "/", label: "Home", icon: Book },
    { to: "/reading", label: "Reading", icon: BookA },
    { to: "/vocabulary", label: "Vocabulary", icon: Languages },
    { to: "/flashcards", label: "Flashcards", icon: StickyNote },
    { to: "/tongue-twisters", label: "Tongue Twisters", icon: Languages },
    { to: "/pdf-reader", label: "PDF Reader", icon: FileText },
  { to: "/subjects", label: "Subjects", icon: FileText },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Languages className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">commando-speaker</span>
          </div>
          <div className="flex gap-1 items-center">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
