import { ReactNode } from "react";

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: "default" | "glass" | "dark" | "outline";
  onClick?: () => void;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "ghost-indigo";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export interface StatusBadgeProps extends BaseComponentProps {
  status: "success" | "warning" | "error" | "info" | "normal";
  label?: string;
  pulse?: boolean;
}
