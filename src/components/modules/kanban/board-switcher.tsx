"use client";

import React from 'react';
import { LocalStorageManager } from '@/lib/storage/LocalStorageManager';
import { KanbanBoard as KanbanBoardType } from '@/types/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getTemplateColumns, BoardTemplateId } from './board-templates';
import { Plus, Search } from 'lucide-react';

interface BoardSwitcherProps {
  selectedBoardId: string;
  onSelectBoard: (id: string) => void;
}

export function BoardSwitcher({ selectedBoardId, onSelectBoard }: BoardSwitcherProps) {
  const storage = LocalStorageManager.getInstance();
  const [boards, setBoards] = React.useState<KanbanBoardType[]>([]);
  const [query, setQuery] = React.useState('');
  const [openNew, setOpenNew] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [template, setTemplate] = React.useState<BoardTemplateId>('basic');
  const [creating, setCreating] = React.useState(false);

  const loadBoards = React.useCallback(async () => {
    const res = await storage.loadKanbanBoards();
    if (res.success && res.data) setBoards(res.data);
  }, [storage]);

  React.useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const filtered = boards
    .filter(b => b.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const id = `board_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const board: KanbanBoardType = {
        id,
        name: newName.trim(),
        description: '',
        columns: getTemplateColumns(template),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await storage.saveKanbanBoard(board);
      setOpenNew(false);
      setNewName('');
      setTemplate('basic');
      await loadBoards();
      onSelectBoard(id);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-72">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search boards..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <Select value={selectedBoardId} onValueChange={onSelectBoard}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select board" />
        </SelectTrigger>
        <SelectContent>
          <ScrollArea className="h-64">
            {filtered.map(b => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </ScrollArea>
        </SelectContent>
      </Select>
      <Button size="sm" onClick={() => setOpenNew(true)}>
        <Plus className="h-4 w-4 mr-2" /> New Board
      </Button>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="board-name">Name</Label>
              <Input id="board-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Personal, Work, Side Project" />
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={template} onValueChange={(v: BoardTemplateId) => setTemplate(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="scrum">Scrum</SelectItem>
                  <SelectItem value="bug-triage">Bug Triage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating}>{creating ? 'Creating...' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

