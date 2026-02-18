"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "group flex items-center gap-3 w-full p-4 border backdrop-blur-sm shadow-lg min-w-[320px]",
          title: "text-sm font-semibold",
          description: "text-sm",
          actionButton: "bg-blue-500/10 border border-blue-500/30 text-blue-200 hover:bg-blue-500/20 hover:border-blue-500/50 px-3 py-2 text-sm font-medium",
          cancelButton: "bg-slate-500/10 border border-slate-500/30 text-slate-200 hover:bg-slate-500/20 hover:border-slate-500/50 px-3 py-2 text-sm font-medium",
          closeButton: "bg-slate-500/10 border border-slate-500/30 text-slate-400 hover:bg-slate-500/20",
          success: "bg-emerald-500/20 border-emerald-500/30 text-emerald-100 shadow-emerald-500/10",
          error: "bg-red-500/20 border-red-500/30 text-red-100 shadow-red-500/10",
          warning: "bg-amber-500/20 border-amber-500/30 text-amber-100 shadow-amber-500/10",
          info: "bg-blue-500/20 border-blue-500/30 text-blue-100 shadow-blue-500/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };