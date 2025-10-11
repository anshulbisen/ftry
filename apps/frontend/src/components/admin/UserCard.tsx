import { memo, useCallback } from 'react';
import type { SafeUser } from '@ftry/shared/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash, Ban } from 'lucide-react';

interface UserCardProps {
  user: SafeUser;
  currentUserId?: string;
  isSuperAdmin: boolean;
  onEdit: (userId: string) => void;
  onDeactivate: (userId: string) => void;
  onDelete: (userId: string) => void;
}

export const UserCard = memo<UserCardProps>(
  ({ user, currentUserId, isSuperAdmin, onEdit, onDeactivate, onDelete }) => {
    const handleEdit = useCallback(() => {
      onEdit(user.id);
    }, [onEdit, user.id]);

    const handleDeactivate = useCallback(() => {
      onDeactivate(user.id);
    }, [onDeactivate, user.id]);

    const handleDelete = useCallback(() => {
      onDelete(user.id);
    }, [onDelete, user.id]);

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'active':
          return <Badge variant="default">Active</Badge>;
        case 'inactive':
          return <Badge variant="secondary">Inactive</Badge>;
        case 'pending':
          return <Badge variant="outline">Pending</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };

    return (
      <div className="flex items-center justify-between border-b p-4 hover:bg-accent/50">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {user.firstName.charAt(0)}
            {user.lastName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline">{user.role.name.replace('_', ' ')}</Badge>
          {isSuperAdmin && (
            <span className="text-sm text-muted-foreground min-w-[100px] truncate">
              {user.tenant?.name || 'No Tenant'}
            </span>
          )}
          {getStatusBadge(user.status)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              {user.id !== currentUserId && (
                <>
                  <DropdownMenuItem onClick={handleDeactivate}>
                    <Ban className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  },
);

UserCard.displayName = 'UserCard';
