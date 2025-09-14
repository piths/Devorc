'use client';

import React, { useState } from 'react';
import { useStorage } from '@/lib/storage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { KanbanBoard } from '@/types/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StorageDemo() {
  const { storageManager, isAvailable, storageInfo, error, cleanupOldData } = useStorage();
  const [testData, setTestData] = useState<KanbanBoard | KanbanBoard[] | null>(null);
  
  // Test the useLocalStorage hook
  const {
    data: savedData,
    loading,
    error: hookError,
    save,
    remove
  } = useLocalStorage<{ message: string; timestamp: Date }>('demo_data', {
    autoSave: true,
    autoSaveInterval: 5, // 5 seconds for demo
    onSave: () => console.log('Data auto-saved!'),
    onError: (err) => console.error('Storage error:', err)
  });

  const handleSaveTestData = async () => {
    const data = {
      message: 'Hello from storage demo!',
      timestamp: new Date()
    };
    
    const success = await save(data);
    if (success) {
      console.log('Data saved successfully');
    }
  };

  const handleSaveKanbanBoard = async () => {
    const board: KanbanBoard = {
      id: 'demo-board-1',
      name: 'Demo Board',
      description: 'A test kanban board',
      columns: [
        {
          id: 'col-1',
          title: 'To Do',
          cards: [
            {
              id: 'card-1',
              title: 'Test Card',
              description: 'This is a test card',
              labels: [],
              assignee: 'demo-user'
            }
          ],
          color: '#3b82f6'
        },
        {
          id: 'col-2',
          title: 'In Progress',
          cards: [],
          color: '#f59e0b'
        },
        {
          id: 'col-3',
          title: 'Done',
          cards: [],
          color: '#10b981'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await storageManager.saveKanbanBoard(board);
    if (result.success) {
      console.log('Kanban board saved successfully');
      setTestData(board);
    } else {
      console.error('Failed to save kanban board:', result.error);
    }
  };

  const handleLoadKanbanBoards = async () => {
    const result = await storageManager.loadKanbanBoards();
    if (result.success) {
      console.log('Loaded kanban boards:', result.data);
      setTestData(result.data || []);
    } else {
      console.error('Failed to load kanban boards:', result.error);
    }
  };

  const handleCleanupOldData = async () => {
    const cleanedCount = await cleanupOldData(1); // Clean data older than 1 day
    console.log(`Cleaned up ${cleanedCount} old items`);
  };

  if (!isAvailable) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">Storage Not Available</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Local storage is not available in this environment.</p>
          {error && (
            <p className="text-sm text-red-500 mt-2">
              Error: {error.message}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Storage Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Storage Info</h4>
              <p className="text-sm">Used: {(storageInfo.used / 1024).toFixed(2)} KB</p>
              <p className="text-sm">DevOrch: {(storageInfo.devOrchUsed / 1024).toFixed(2)} KB</p>
              <p className="text-sm">Total: {(storageInfo.total / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Hook Test</h4>
              {loading ? (
                <p className="text-sm">Loading...</p>
              ) : (
                <div>
                  {savedData ? (
                    <div className="text-sm">
                      <p>Message: {savedData.message}</p>
                      <p>Time: {savedData.timestamp.toLocaleTimeString()}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No saved data</p>
                  )}
                  {hookError && (
                    <p className="text-sm text-red-500">Error: {hookError.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Test Data</h4>
              {testData ? (
                <div className="text-sm">
                  <p>Type: {Array.isArray(testData) ? 'Array' : 'Object'}</p>
                  <p>Items: {Array.isArray(testData) ? testData.length : 1}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No test data</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSaveTestData} size="sm">
              Save Test Data
            </Button>
            <Button onClick={handleSaveKanbanBoard} size="sm" variant="outline">
              Save Kanban Board
            </Button>
            <Button onClick={handleLoadKanbanBoards} size="sm" variant="outline">
              Load Kanban Boards
            </Button>
            <Button onClick={handleCleanupOldData} size="sm" variant="destructive">
              Cleanup Old Data
            </Button>
            <Button onClick={() => remove()} size="sm" variant="destructive">
              Clear Hook Data
            </Button>
          </div>

          {testData && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Test Data Preview:</h4>
              <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(testData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}