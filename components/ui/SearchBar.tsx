import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export function SearchBar({
  containerClassName,
  className,
  ...props
}: SearchBarProps) {
  return (
    <div className={cn("relative w-full md:w-80", containerClassName)}>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        size={18} // Slightly larger for better POS visibility
      />
      <Input
        {...props}
        className={cn(
          // Matching the MenuItemForm input style:
          // h-12 to match the Button height
          // rounded-xl for consistent curves
          // bg-slate-50 for that subtle surface feel
          "h-12 pl-10 pr-4 bg-slate-50 border-slate-200 rounded-xl outline-none focus-visible:ring-1 focus-visible:ring-slate-300 focus-visible:bg-white focus-visible:border-slate-400 transition-all font-medium placeholder:text-slate-400 text-sm shadow-sm",
          className,
        )}
      />
    </div>
  );
}
