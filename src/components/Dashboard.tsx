import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, PieLabelRenderProps, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CarbonActivity } from '@/types';
import { Leaf, Footprints, Flame, ShoppingBag, Droplets, Award, Star, Wind, Share2 } from 'lucide-react';

interface DashboardProps {
  activities: CarbonActivity[];
  totalFootprint: number;
  streak: number;
  greenPoints: number;
  hideTopCard?: boolean;
}

const COLORS = {
  transport: '#0284c7', // sky-600
  diet: '#16a34a', // green-600
  energy: '#ea580c', // orange-600
  shopping: '#8b5cf6', // violet-500
  water: '#06b6d4', // cyan-500
};

export const ICONS: Record<string, any> = {
  transport: Footprints,
  diet: Leaf,
  energy: Flame,
  shopping: ShoppingBag,
  water: Droplets,
};

export function Dashboard({ activities, totalFootprint, streak, greenPoints, hideTopCard }: DashboardProps) {
  const aggregatedData = activities.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + curr.co2ImpactKg;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(aggregatedData).map(([name, value]) => ({
    name,
    value,
  })).sort((a, b) => b.value - a.value);

  const formatLabel = (entry: any) => {
    return `${entry.name} (${entry.value}kg)`;
  };

  // Advanced chart: Group emissions by date
  const emissionsByDate = activities.reduce((acc, curr) => {
    // Only use date part
    const dateStr = new Date(curr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    acc[dateStr] = (acc[dateStr] || 0) + curr.co2ImpactKg;
    return acc;
  }, {} as Record<string, number>);
  
  const timelineData = Object.entries(emissionsByDate).map(([date, impact]) => ({
    date,
    impact: Number(impact.toFixed(1))
  })).slice(-7); // last 7 unique days

  const achievements = [
    {
      id: 'first-step',
      title: 'First Step',
      description: 'Logged your first activity',
      icon: <Star size={24} className="text-amber-500" fill="currentColor" />,
      earned: activities.length > 0
    },
    {
      id: 'streak-master',
      title: 'On Fire',
      description: 'Reached a 3-day streak',
      icon: <Flame size={24} className="text-orange-500" fill="currentColor" />,
      earned: streak >= 3
    },
    {
      id: 'eco-warrior',
      title: 'Eco Warrior',
      description: 'Earned 100+ Green Points',
      icon: <Award size={24} className="text-emerald-500" fill="currentColor" />,
      earned: greenPoints >= 100
    },
    {
      id: 'transport-hero',
      title: 'Transport Hero',
      description: '5+ transport logs',
      icon: <Wind size={24} className="text-sky-500" />,
      earned: activities.filter(a => a.type === 'transport').length >= 5
    },
    {
      id: 'plant-powered',
      title: 'Plant Powered',
      description: '5+ diet logs',
      icon: <Leaf size={24} className="text-green-500" fill="currentColor" />,
      earned: activities.filter(a => a.type === 'diet').length >= 5
    }
  ];

  const handleShare = async () => {
    const earnedAchievements = achievements.filter(a => a.earned).map(a => a.title).join(', ');
    const shareText = `🌱 I'm tracking my carbon footprint with EcoBuddy!
    
🏆 My Stats:
- ⭐️ ${greenPoints} Green Points
- 🔥 ${streak} Day Streak
- 🏅 Achievements: ${earnedAchievements || 'Just getting started!'}
- 🌍 ${totalFootprint.toFixed(1)} kg CO₂e tracked

Join me in saving the planet! 🌍💚 #EcoBuddy #Sustainability #ClimateAction`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My EcoBuddy Stats',
          text: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Stats copied to clipboard! Share them to social media!');
    }
  };

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-1 ${!hideTopCard ? 'md:grid-cols-3' : ''} gap-6`}>
        {!hideTopCard && (
          <Card className="md:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-700 text-white border-0 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Leaf size={100} />
            </div>
            <CardHeader>
              <CardTitle className="text-white/80 font-medium">Your Total Footprint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold mb-2">
                {totalFootprint.toFixed(1)} <span className="text-xl font-normal opacity-80">kg CO₂e</span>
              </div>
              <p className="text-emerald-50 text-sm">
                {totalFootprint > 100 ? "You're slightly above average this month." : "Great job keeping it low!"}
              </p>
            </CardContent>
          </Card>
        )}

        <Card className={`${!hideTopCard ? 'md:col-span-2' : 'w-full'} shadow-sm border-slate-200 rounded-3xl h-full`}>
          <CardHeader>
            <CardTitle className="text-slate-800 text-sm font-semibold uppercase tracking-wider">Emissions by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 240, minWidth: 0, minHeight: 0 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={formatLabel}
                      labelLine={false}
                      className="text-xs font-medium focus:outline-none"
                      style={{outline: 'none'}}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}kg CO₂e`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400">
                  No data logged yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 rounded-3xl">
        <CardHeader>
          <CardTitle className="text-slate-800 text-sm font-semibold uppercase tracking-wider">7-Day Analysis View</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 280, minWidth: 0, minHeight: 0 }}>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value} kg`, 'Impact']} 
                  />
                  <Bar dataKey="impact" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
                  Log activities over multiple days to see trends here.
               </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-slate-800 text-sm font-semibold uppercase tracking-wider">Eco-Achievements</CardTitle>
          <button 
            onClick={handleShare}
            aria-label="Share your eco achievements"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400 dark:hover:bg-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <Share2 size={14} />
            Share Stats
          </button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`flex flex-col items-center p-4 rounded-2xl border text-center transition-all ${
                  achievement.earned 
                    ? 'bg-emerald-50 border-emerald-100 shadow-sm' 
                    : 'bg-slate-50 border-slate-100 opacity-50 grayscale'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${achievement.earned ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                  {achievement.icon}
                </div>
                <h4 className="font-semibold text-slate-800 text-xs mb-1">{achievement.title}</h4>
                <p className="text-[10px] text-slate-500">{achievement.description}</p>
                {achievement.earned && (
                  <div className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                    UNLOCKED
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 rounded-3xl">
        <CardHeader>
          <CardTitle className="text-slate-800 text-sm font-semibold uppercase tracking-wider">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-slate-500 italic text-sm">No recent activities.</p>
            ) : (
              activities.slice(0, 5).map((activity) => {
                const Icon = ICONS[activity.type] || Leaf;
                return (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm text-slate-600">
                        <Icon size={18} color={COLORS[activity.type as keyof typeof COLORS]} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{activity.title}</p>
                        <p className="text-xs text-slate-500">{new Date(activity.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="font-semibold text-slate-700 text-sm">
                      +{activity.co2ImpactKg} kg
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

