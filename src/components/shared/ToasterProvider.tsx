"use client";

import * as React from "react";
import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      closeButton
      toastOptions={{
        duration: 3500,
        classNames: {
          toast:
            "group w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-4 text-zinc-900 shadow-lg",
          title: "text-sm font-semibold text-zinc-900",
          description: "mt-1 text-sm text-zinc-500",
          closeButton:
            "rounded-md p-1 text-zinc-400 hover:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2 focus:ring-offset-white",
          success: "sonner-toast--success",
          error: "sonner-toast--error",
          warning: "sonner-toast--warning",
          info: "sonner-toast--info"
        }
      }}
    />
  );
}

