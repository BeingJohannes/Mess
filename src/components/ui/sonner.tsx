"use client";

import { useTheme } from "next-themes@0.4.6";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      offset="24px"
      duration={7000}
      style={
        {
          "--normal-bg": "transparent",
          "--normal-text": "white",
          "--normal-border": "none",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          background: 'transparent',
          border: 'none',
          padding: 0,
          boxShadow: 'none',
        },
        className: 'colorful-toast',
        // Disable any default styling that could interfere
        unstyled: true,
      }}
      {...props}
    />
  );
};

export { Toaster };