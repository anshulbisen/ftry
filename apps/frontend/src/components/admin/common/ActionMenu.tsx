import React from 'react';

/**
 * ActionMenu Component
 *
 * Permission-aware action menu for table rows and detail pages.
 * Children are filtered based on PermissionGate components.
 *
 * TODO: Implement with shadcn/ui DropdownMenu component
 * TODO: Add icon support
 * TODO: Add keyboard navigation
 */
export interface ActionMenuProps {
  children: React.ReactNode;
  label?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ children, label = 'Actions' }) => {
  // TODO: Replace with proper dropdown menu implementation
  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        {label}
      </button>
      {/* TODO: Add dropdown menu with children */}
      <div className="hidden">{children}</div>
    </div>
  );
};

export interface ActionMenuItemProps {
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  destructive?: boolean;
}

export const ActionMenuItem: React.FC<ActionMenuItemProps> = ({
  onClick,
  children,
  icon,
  destructive = false,
}) => {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-4 py-2 text-sm ${
        destructive ? 'text-red-600' : 'text-gray-700'
      } hover:bg-gray-100`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
