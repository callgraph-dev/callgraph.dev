import React from "react";

export interface CardProps {
  header: React.ReactNode | null;
  body: React.ReactNode;
  footer: React.ReactNode | null;
}

export const Card: React.FC<CardProps> = ({
  header = null,
  body,
  footer = null,
}) => {
  return (
    <div className="divide-y divide-gray-200 rounded-lg overflow-hidden bg-white shadow max-w-sm max-h-64">
      {header && <div className="px-4 py-2 truncate w-full">{header}</div>}
      <div className="px-4 py-5 w-">{body}</div>
      {footer && <div className="px-4 py-2 truncate w-full">{footer}</div>}
    </div>
  );
};
