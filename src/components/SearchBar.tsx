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
    <form onSubmit={handleSubmit} className="w-full max-w-[680px] mx-auto">
      <div className="flex gap-3 shadow-xl shadow-black/25 rounded-2xl">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B7280] transition-colors group-focus-within:text-[#3B82F6]" />
          <input
            type="text"
            placeholder="Search cards (e.g., 2023 Bowman Chrome Shohei Ohtani)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-[52px] pl-14 pr-12 text-[15px] bg-[#111827] border border-[#1F2937] rounded-l-2xl text-[#E5E7EB] placeholder:text-[#6B7280] transition-all duration-200 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20"
          />
          {(query || showClear) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-[#1F2937] transition-colors duration-150 text-[#6B7280] hover:text-[#E5E7EB]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={isLoading || !query.trim()}
          className="h-[52px] px-7 font-medium rounded-r-2xl rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 disabled:opacity-40"
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