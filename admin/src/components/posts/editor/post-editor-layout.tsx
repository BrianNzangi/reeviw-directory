import type { ReactNode } from "react";

type PostEditorLayoutProps = {
  main: ReactNode;
  sidebar: ReactNode;
};

export function PostEditorLayout({ main, sidebar }: PostEditorLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        {main}
      </div>
      {sidebar}
    </div>
  );
}
