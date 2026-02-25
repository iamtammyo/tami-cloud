"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType>({
  value: "",
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
});

function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

function SelectTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open, setOpen } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
}

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext);
  return <span>{value || placeholder}</span>;
}

function SelectContent({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = React.useContext(SelectContext);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
        {children}
      </div>
    </>
  );
}

function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext);
  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        selectedValue === value && "bg-accent text-accent-foreground"
      )}
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
    >
      {children}
    </div>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
