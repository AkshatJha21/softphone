import { Button } from "./ui/button";

const DIALPAD_KEYS = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

interface DialpadProps {
  onDigit: (digit: string) => void;
  disabled?: boolean;
}

export function Dialpad({ onDigit, disabled = false }: DialpadProps) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {DIALPAD_KEYS.map((key) => (
        <Button
          key={key.digit}
          className={`dialpad-btn ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !disabled && onDigit(key.digit)}
          disabled={disabled}
          aria-label={`${key.digit}${key.letters ? `, ${key.letters}` : ""}`}
        >
          <span className="text-2xl font-semibold text-foreground text-white">
            {key.digit}
          </span>
          {key.letters && (
            <span className="text-[10px] tracking-widest text-white mt-0.5">
              {key.letters}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
