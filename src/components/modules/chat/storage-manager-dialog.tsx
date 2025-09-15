'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HardDrive } from 'lucide-react';
import { StorageManager } from './storage-manager';

interface StorageManagerDialogProps {
  children: React.ReactNode;
}

export function StorageManagerDialog({ children }: StorageManagerDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Management
          </DialogTitle>
          <DialogDescription>
            Monitor and optimize your local storage usage for better performance.
          </DialogDescription>
        </DialogHeader>
        <StorageManager />
      </DialogContent>
    </Dialog>
  );
}