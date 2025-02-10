// app/members/(default)/treasury/bookkeeping/import-xls/page.tsx

'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import { Label } from '@/components/members/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/members/ui/card';
import { toast } from '@/components/members/ui/sonner';
import ThemedBounceLoader from '@/components/members/ui/ThemedBounceLoader';

export default function ImportXlsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<string>('');

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setImportResult('');

    if (!file) {
      setImportResult('Please select a file first.');
      return;
    }
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/members/api/upload-xls', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      toast.success(`Imported ${data.importedCount} transactions`, {
        classNames: {
          toast: 'text-xl',
          description: 'text-base',
        },
      });
      setImportResult(`Imported ${data.importedCount} rows successfully!`);
    } catch (error: any) {
      toast.error('Import failed', {
        description: error.message,
        classNames: {
          toast: 'text-xl',
          description: 'text-base',
        },
      });
      setImportResult('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {isLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <ThemedBounceLoader loading={true} />
        </div>
      )}
      <Card className="w-full max-w-xl mx-auto p-4 space-y-4">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Import Bank Statements (XLS/XLSX)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleImport} className="space-y-4">
            <div className="space-y-2">
              <Label>Excel File (.xls or .xlsx)</Label>
              <Input
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) setFile(selected);
                }}
              />
            </div>
            <Button type="submit" disabled={!file || isLoading}>
              {isLoading ? 'Importing...' : 'Import XLS'}
            </Button>
          </form>
          {importResult && (
            <div className="text-lg text-slate-700 dark:text-slate-300">
              {importResult}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
