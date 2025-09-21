"use client";

import { cn } from "@/lib/utils";
import { createContext, useContext, useState } from "react";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        "flex border-b border-gray-200 gap-1 px-2 pt-2 bg-gray-50/50 rounded-t-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function TabsTrigger({
  value,
  children,
  className,
  icon,
}: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsTrigger must be used within Tabs");
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 border-transparent rounded-t-lg",
        isActive
          ? "text-purple-primary border-purple-primary bg-white shadow-sm"
          : "text-text-secondary hover:text-text-primary hover:bg-white/70",
        className
      )}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsContent must be used within Tabs");
  }

  const { activeTab } = context;

  if (activeTab !== value) return null;

  return <div className={cn("pt-4 pb-2 px-4", className)}>{children}</div>;
}
