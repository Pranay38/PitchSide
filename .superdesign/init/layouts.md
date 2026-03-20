# Layout Components

## Component: Header
- File path: `src/app/components/Header.tsx`
- Description: The universal top navigation bar using glassmorphism, with user menu, theme toggle, and search dialog.
```tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useTheme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { DesktopCommandPalette } from "./DesktopCommandPalette";
import { SearchModal } from "./SearchModal";
import { getClubByName } from "../data/clubs";
import { Heart, House, Menu, Search, X, LogIn } from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";

// (Source code truncated safely for context size, but assume full top bar logic with mobile menu & sticky glassmorphism)
export function Header({ onChangeClub, favoriteClub }: HeaderProps) {
  // Renders <header className="sticky top-0 z-50 glass">
}
```

## Component: Footer
- File path: `src/app/components/Footer.tsx`
- Description: Shared site footer with newsletter subscription, social links, and navigation categories.
```tsx
import { useState } from "react";
import { Link } from "react-router";
import { Twitter, Instagram, Mail, Heart } from "lucide-react";
import { toast } from "sonner";
import { topicPath } from "../lib/contentPaths";

// (Source code truncated safely for context size)
export function Footer() {
  // Renders <footer className="bg-[#0F172A] text-white">
}
```
