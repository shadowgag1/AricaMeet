import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from "lucide-react";

interface PermissionModalProps {
  isOpen: boolean;
  requesterName: string;
  onApprove: () => void;
  onDeny: () => void;
}

export function PermissionModal({
  isOpen,
  requesterName,
  onApprove,
  onDeny
}: PermissionModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" data-testid="modal-permission">
        <DialogHeader>
          <DialogTitle>Whiteboard Access Request</DialogTitle>
          <DialogDescription>
            A participant is requesting access to the whiteboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary">
            <div className="rounded-full bg-primary/20 p-2">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{requesterName}</p>
              <p className="text-sm text-muted-foreground">wants to use the whiteboard</p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onDeny}
              data-testid="button-deny-access"
            >
              Deny
            </Button>
            <Button
              onClick={onApprove}
              data-testid="button-approve-access"
            >
              Approve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
