import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { File, X, CheckCircle, AlertCircle } from "lucide-react";
import type { FileTransfer } from "@shared/schema";

interface FileTransferModalProps {
  isOpen: boolean;
  transfer: FileTransfer | null;
  onClose: () => void;
  onCancel?: () => void;
}

export function FileTransferModal({
  isOpen,
  transfer,
  onClose,
  onCancel
}: FileTransferModalProps) {
  if (!transfer) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-file-transfer">
        <DialogHeader>
          <DialogTitle>File Transfer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <File className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" data-testid="text-file-name">
                {transfer.fileName}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(transfer.fileSize)} • from {transfer.senderName}
              </p>
            </div>
          </div>

          {transfer.status === 'transferring' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(transfer.progress)}%</span>
              </div>
              <Progress value={transfer.progress} className="h-2" />
            </div>
          )}

          {transfer.status === 'completed' && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span>Transfer completed successfully</span>
            </div>
          )}

          {transfer.status === 'failed' && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Transfer failed</span>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            {transfer.status === 'transferring' && onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                data-testid="button-cancel-transfer"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={onClose}
              data-testid="button-close-transfer"
            >
              {transfer.status === 'completed' ? 'Done' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
