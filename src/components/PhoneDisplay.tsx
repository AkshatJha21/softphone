import { Delete } from "lucide-react";

interface PhoneDisplayProps {
  number: string;
  onBackspace: () => void;
  disabled?: boolean;
}

export function PhoneDisplay({
  number,
  onBackspace,
  disabled = false,
}: PhoneDisplayProps) {
  return (
    <div className="flex items-center justify-between px-4 py-6 min-h-[80px]">
      <div className="flex-1 text-center">
        <span
          className={`font-display text-3xl tracking-wider ${
            number ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {number || "Enter number"}
        </span>
      </div>

      {number && !disabled && (
        <button
          onClick={onBackspace}
          className="p-2 rounded-full hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Delete last digit"
        >
          <Delete className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
