import type { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return <table className="w-full text-sm">{children}</table>;
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-muted/60">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="border-t border-border">{children}</tr>;
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <th className="px-4 py-2 text-left font-semibold">{children}</th>;
}

export function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-2 align-top">{children}</td>;
}
