"use client";

import { useState, useRef, useEffect } from "react";

export type ActionMenuItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
  onClick: () => void | Promise<void>;
  disabled?: boolean;
};

export function ActionMenu({ 
  items, 
  triggerLabel = "Acciones",
  triggerClassName = ""
}: { 
  items: ActionMenuItem[];
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleItemClick = (item: ActionMenuItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClassName || "rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm font-bold text-[var(--app-text)] transition duration-200 hover:bg-[var(--app-surface-muted)]"}
      >
        {triggerLabel}
      </button>
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-lg">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              className={`w-full px-4 py-2 text-left text-sm font-semibold transition duration-200 first:rounded-t-xl last:rounded-b-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                item.variant === "danger"
                  ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                  : "text-[var(--app-text)] hover:bg-[var(--app-surface-muted)]"
              }`}
            >
              <div className="flex items-center gap-2">
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
