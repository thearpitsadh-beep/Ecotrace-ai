import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, Upload, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { CarbonActivity } from '@/types';

interface DataSyncProps {
  activities: CarbonActivity[];
  points: number;
  onImport: (activities: CarbonActivity[], points: number) => void;
}

export function DataSync({ activities, points, onImport }: DataSyncProps) {
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const data = {
      version: 1,
      timestamp: new Date().toISOString(),
      points,
      activities
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecotrace-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.activities && Array.isArray(data.activities)) {
          onImport(data.activities, typeof data.points === 'number' ? data.points : 0);
          e.target.value = ''; // Reset input
        } else {
          throw new Error('Invalid file format. Ensure it is a valid EcoTrace backup.');
        }
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse the backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
         <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full w-max mx-auto mb-4">
            <Database size={28} />
         </div>
         <h2 className="text-2xl font-bold text-slate-800">Your Data, Your Control</h2>
         <p className="text-slate-500 mt-2">Export your carbon footprint history to a secure file or restore a backup across devices.</p>
      </div>

      {importError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{importError}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-max mb-3">
              <Download size={24} />
            </div>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Save all your logged activities and green points as a JSON file.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                <p><strong>Contains:</strong> {activities.length} activities, {points} Green Points</p>
              </div>
              <button
                onClick={handleExport}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download Backup
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-max mb-3">
              <Upload size={24} />
            </div>
            <CardTitle>Import Data</CardTitle>
            <CardDescription>Restore your history from a previously exported EcoTrace JSON file.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                 <p className="flex items-center gap-2"><AlertCircle size={16} className="text-amber-500"/> This will overwrite current data.</p>
               </div>
               <label htmlFor="import-data" className="w-full py-3 bg-emerald-100 text-emerald-800 rounded-xl font-medium hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2 cursor-pointer border border-emerald-200">
                 <RefreshCw size={18} />
                 Choose File to Restore
                 <input
                   id="import-data"
                   type="file"
                   accept=".json"
                   className="hidden"
                   onChange={handleImport}
                 />
               </label>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
