import type { ReactNode } from "react";

export interface Column {
  key: string;
  label: string;
  className?: string;
}

export function DataTable({
  columns,
  children,
  minWidth = "min-w-[720px]",
}: {
  columns: Column[];
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink/12 bg-card">
      <div className="overflow-x-auto">
        <table className={`w-full ${minWidth} border-collapse text-sm`}>
          <thead>
            <tr className="border-b border-ink/12 bg-paper-deep/70">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`eyebrow px-4 py-3 text-left text-muted-foreground ${column.className ?? ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function TRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={`border-b border-ink/10 transition-colors last:border-b-0 hover:bg-paper-deep/45 ${className}`}
    >
      {children}
    </tr>
  );
}

export function TCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}
