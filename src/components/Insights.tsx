import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CarbonActivity, Insight } from '@/types';
import { Lightbulb, Sparkles, AlertCircle, ArrowDown } from 'lucide-react';

interface AIInsightsProps {
  activities: CarbonActivity[];
  totalFootprint: number;
}

export function AIInsights({ activities, totalFootprint }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (activities.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activities, totalFootprint }),
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        let errorData = null;
        try { errorData = JSON.parse(errorText); } catch(e) {}
        throw new Error(errorData?.error || 'Failed to fetch AI insights');
      }
      
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data.insights) {
          setInsights(data.insights);
        }
      } catch (e) {
        throw new Error('Received invalid format from insights API');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch on initial mount or manual refresh, to avoid excessive API calls
    if (activities.length > 0 && insights.length === 0 && !loading && !error) {
       fetchInsights();
    }
  }, [activities.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="text-emerald-500" size={20} />
            AI Recommendations
          </h2>
          <p className="text-sm text-slate-500">Personalized ways to reduce your footprint based on your logs.</p>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading || activities.length === 0}
          className="px-4 py-2 bg-emerald-100 text-emerald-800 font-medium rounded-md hover:bg-emerald-200 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'Analyzing...' : 'Refresh Insights'}
        </button>
      </div>

      {activities.length === 0 ? (
        <Card className="bg-slate-50 border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="text-slate-400 mb-3" size={32} />
            <p className="text-slate-600 font-medium">Not enough data to analyze</p>
            <p className="text-slate-500 text-sm mt-1">Log a few activities first so our AI understands your footprint.</p>
          </CardContent>
        </Card>
      ) : loading && insights.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
             <Card key={i} className="animate-pulse bg-slate-50/50">
               <CardContent className="p-6 h-[140px]"></CardContent>
             </Card>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, idx) => (
            <Card key={idx} className="border-emerald-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-50 rounded-full text-emerald-600">
                    <Lightbulb size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                      {insight.category}
                    </span>
                    <p className="text-slate-800 text-sm font-medium leading-relaxed mb-3">
                      {insight.tip}
                    </p>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                       <ArrowDown size={14} />
                       Save {insight.potentialSavingsKg} kg
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
