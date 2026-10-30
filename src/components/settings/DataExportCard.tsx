import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { fetchAccountExport } from '@/services/accountExport';
import { todayKey } from '@/lib/dates';

interface DataExportCardProps {
  userId: string;
}

export function DataExportCard({ userId }: DataExportCardProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await fetchAccountExport(userId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `daytrack-export-${todayKey()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: 'Could not export your data',
        description: 'Check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Export your data</CardTitle>
        <CardDescription>
          Download your profile, challenges, tasks, daily records, and change history as a JSON file.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end">
        <Button variant="outline" className="gap-2" onClick={() => void handleExport()} disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {exporting ? 'Preparing file...' : 'Download JSON'}
        </Button>
      </CardContent>
    </Card>
  );
}
