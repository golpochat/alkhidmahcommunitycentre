import { Award, BookOpen, Heart, Users, type LucideIcon } from "lucide-react";
import type { AboutValueIconKey } from "@/lib/about-content";

export const ABOUT_VALUE_ICON_MAP: Record<AboutValueIconKey, LucideIcon> = {
  book: BookOpen,
  heart: Heart,
  users: Users,
  award: Award,
};
