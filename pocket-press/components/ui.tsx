"use client";

import { useId } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  const look =
    variant === "primary"
      ? "bg-inv-bg text-inv-fg hover:opacity-90"
      : "border border-line text-fg hover:border-fg";
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium transition duration-150 ease-out disabled:cursor-progress disabled:opacity-70 ${look} ${className}`}
      {...props}
    />
  );
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-surface p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              const i = options.findIndex((x) => x.value === value);
              const next = options[(i + (e.key === "ArrowRight" ? 1 : options.length - 1)) % options.length];
              onChange(next.value);
              (e.currentTarget.parentElement?.children[options.indexOf(next)] as HTMLElement)?.focus();
            }}
            tabIndex={active ? 0 : -1}
            className={`rounded-full px-4 py-1.5 text-[13px] transition duration-150 ease-out ${
              active ? "bg-inv-bg font-medium text-inv-fg" : "text-muted hover:text-fg"
            }`}
          >
            {o.label}
            {o.hint ? <span className="ml-1.5 font-mono opacity-70">{o.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-[15px] font-medium">
          {label}
        </label>
        {description ? <p className="text-[13px] text-muted">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full border transition duration-150 ease-out ${
          checked ? "border-inv-bg bg-inv-bg" : "border-line bg-surface"
        }`}
      >
        <span
          className={`absolute top-0.5 h-[18px] w-[18px] rounded-full transition-all duration-150 ease-out ${
            checked ? "left-[18px] bg-inv-fg" : "left-0.5 bg-muted"
          }`}
        />
      </button>
    </div>
  );
}
