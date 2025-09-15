'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, Label } from '@/types/storage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Form validation schema
const cardFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  assignee: z.string().max(50, 'Assignee name must be less than 50 characters').optional(),
  dueDate: z.date().optional(),
  githubIssueId: z.string().max(20, 'GitHub issue ID must be less than 20 characters').optional(),
});

type CardFormData = z.infer<typeof cardFormSchema>;

interface CardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Partial<Card>) => void;
  card?: Card | null;
}

export function CardEditModal({ isOpen, onClose, onSave, card }: CardEditModalProps) {
  const [labels, setLabels] = React.useState<Label[]>(card?.labels || []);
  const [newLabelName, setNewLabelName] = React.useState('');
  const [newLabelColor, setNewLabelColor] = React.useState('#6366f1');

  const form = useForm<CardFormData>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      title: '',
      description: '',
      assignee: '',
      dueDate: undefined,
      githubIssueId: '',
    },
  });

  // Reset form when card changes
  useEffect(() => {
    if (card) {
      form.reset({
        title: card.title,
        description: card.description,
        assignee: card.assignee || '',
        dueDate: card.dueDate ? new Date(card.dueDate) : undefined,
        githubIssueId: card.githubIssueId || '',
      });
      setLabels(card.labels || []);
    } else {
      form.reset({
        title: '',
        description: '',
        assignee: '',
        dueDate: undefined,
        githubIssueId: '',
      });
      setLabels([]);
    }
  }, [card, form]);

  const onSubmit = (data: CardFormData) => {
    const cardData: Partial<Card> = {
      ...data,
      labels,
      assignee: data.assignee || undefined,
      githubIssueId: data.githubIssueId || undefined,
    };

    onSave(cardData);
  };

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;

    const newLabel: Label = {
      id: `label_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newLabelName.trim(),
      color: newLabelColor,
      description: '',
    };

    setLabels([...labels, newLabel]);
    setNewLabelName('');
  };

  const handleRemoveLabel = (labelId: string) => {
    setLabels(labels.filter(label => label.id !== labelId));
  };

  const predefinedColors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {card ? 'Edit Card' : 'Create New Card'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter card title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter card description..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Labels */}
            <div className="space-y-3">
              <FormLabel>Labels</FormLabel>
              
              {/* Existing Labels */}
              {labels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="secondary"
                      className="px-3 py-1 text-sm"
                      style={{
                        backgroundColor: `${label.color}20`,
                        color: label.color,
                        borderColor: `${label.color}40`,
                      }}
                    >
                      {label.name}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                        onClick={() => handleRemoveLabel(label.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add New Label */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Label name..."
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddLabel();
                    }
                  }}
                />
                <div className="flex items-center gap-1">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        newLabelColor === color
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewLabelColor(color)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLabel}
                  disabled={!newLabelName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Assignee and Due Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assignee */}
              <FormField
                control={form.control}
                name="assignee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter assignee name..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* GitHub Issue ID */}
            <FormField
              control={form.control}
              name="githubIssueId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Issue ID</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {card ? 'Update Card' : 'Create Card'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}