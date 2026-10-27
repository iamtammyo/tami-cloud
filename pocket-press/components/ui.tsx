"use client";

import { forwardRef, useId } from "react";

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }
>(function Button({ variant = "primary", className = "", ...props }, ref) {
  const look =
    variant === "primary"
      ? "bg-inv-bg text-inv-fg hover:opacity-90"
      : "border border-line text-fg hover:border-fg";
  return (
    <button
      ref={ref}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium transition duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 ${look} ${className}`}
      {...props}
    />
  );
});

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
    <div role="radiogroup" aria-label={label} className="inline-flex w-max rounded-full bg-surface p-1">
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
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] transition duration-150 ease-out ${
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

/** Cards that behave as a radio group: arrow keys move, Space/Enter picks. Selected = 1.5px fg border. */
export function RadioCards<T extends string>({
  label,
  value,
  options,
  onChange,
  className = "",
  render,
}: {
  label: string;
  value: T;
  options: { value: T; disabled?: boolean }[];
  onChange: (v: T) => void;
  className?: string;
  render: (value: T, state: { selected: boolean; disabled: boolean }) => React.ReactNode;
}) {
  const enabled = options.filter((o) => !o.disabled);
  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {options.map((o) => {
        const selected = o.value === value;
        const disabled = !!o.disabled;
        return (
          <div
            key={o.value}
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled || undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => !disabled && onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                if (!disabled) onChange(o.value);
                return;
              }
              const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
              if (!dir || !enabled.length) return;
              e.preventDefault();
              const i = enabled.findIndex((x) => x.value === value);
              const next = enabled[(i + dir + enabled.length) % enabled.length];
              onChange(next.value);
              const el = e.currentTarget.parentElement?.children[options.indexOf(next)] as HTMLElement | undefined;
              el?.focus();
            }}
            className={`relative rounded-[12px] p-3 text-left transition duration-150 ease-out ${
              selected ? "border-[1.5px] border-fg" : "border border-line"
            } ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:border-fg"}`}
            style={selected ? undefined : { margin: "0.5px" }}
          >
            {render(o.value, { selected, disabled })}
          </div>
        );
      })}
    </div>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 font-mono text-[11px] text-muted">{children}</span>
  );
}

export function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-line p-4 text-[13px]">
      <p className="font-medium">{title}</p>
      <div className="mt-1 text-muted">{children}</div>
    </div>
  );
}

export function SectionLabel({ children, as: As = "h2" }: { children: React.ReactNode; as?: "h2" | "h3" | "p" }) {
  return <As className="font-mono text-[13px] text-muted">{children}</As>;
}

export const fieldClass =
  "h-10 w-full rounded-[10px] border border-line bg-bg px-3 text-[15px] text-fg outline-none transition duration-150 ease-out placeholder:text-muted focus:border-fg";

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
}) {
  const look =
    variant === "primary" ? "bg-inv-bg text-inv-fg hover:opacity-90" : "border border-line text-fg hover:border-fg";
  return (
    <a
      href={href}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium transition duration-150 ease-out ${look} ${className}`}
    >
      {children}
    </a>
  );
}
