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
    <form onSubmit={handleSubmit} className="w-full max-w-[720px] mx-auto">
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="Paste full card name (e.g., 2023 Bowman Chrome Sapphire #67 Shohei Ohtani)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-14 pl-14 pr-12 text-base bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground/60 transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {(query || showClear) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-secondary transition-colors duration-150 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={isLoading || !query.trim()}
          className="h-14 px-8 font-semibold rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all duration-150 disabled:opacity-50"
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