import { useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear?: () => void;
  isLoading: boolean;
  showClear?: boolean;
}

export function SearchBar({ onSearch, onClear, isLoading, showClear }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    onClear?.();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Paste full card name (e.g., 2023 Bowman Chrome Sapphire #67 Shohei Ohtani Angels)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-10 h-14 text-base bg-card border-border/50 shadow-sm focus-visible:ring-primary/30"
          />
          {(query || showClear) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={isLoading || !query.trim()}
          className="h-14 px-8 font-semibold"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>
    </form>
  );
}
