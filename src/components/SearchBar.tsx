import { useState } from "react";
import { Search, Loader2, X } from "lucide-react";
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
    <form onSubmit={handleSubmit} className="w-full max-w-[640px]">
      <div className="flex gap-0 rounded-2xl overflow-hidden border border-border focus-within:border-primary transition-colors duration-150">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="Search cards (e.g., 2023 Bowman Chrome Shohei Ohtani)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-[54px] pl-11 pr-10 text-sm bg-card text-foreground placeholder:text-muted-foreground transition-all duration-150 focus:outline-none"
          />
          {(query || showClear) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-secondary transition-colors duration-150 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={isLoading || !query.trim()}
          className="h-[54px] px-6 font-medium rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </div>
    </form>
  );
}
