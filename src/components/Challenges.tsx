import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, Leaf, Shield, Recycle, Droplet, Battery } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: any;
  color: string;
}

const CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: 'Non-Carbon Week',
    description: 'Commit to cycling, walking, or public transport for 7 consecutive days.',
    points: 50,
    icon: Leaf,
    color: 'text-emerald-500 bg-emerald-50 border-emerald-200'
  },
  {
    id: 'c2',
    title: 'Plastic-Free Challenge',
    description: 'Avoid single-use plastics for your grocery shopping this weekend.',
    points: 30,
    icon: Recycle,
    color: 'text-blue-500 bg-blue-50 border-blue-200'
  },
  {
    id: 'c3',
    title: 'Plant-Based Pioneer',
    description: 'Eat only plant-based meals for 3 days in a row.',
    points: 40,
    icon: Shield,
    color: 'text-green-500 bg-green-50 border-green-200'
  },
  {
    id: 'c4',
    title: 'Water Saver',
    description: 'Take showers under 5 minutes for a whole week.',
    points: 25,
    icon: Droplet,
    color: 'text-cyan-500 bg-cyan-50 border-cyan-200'
  },
  {
    id: 'c5',
    title: 'Energy Efficient',
    description: 'Switch to LED bulbs or unplug unused appliances for a month.',
    points: 60,
    icon: Battery,
    color: 'text-amber-500 bg-amber-50 border-amber-200'
  }
];

interface ChallengesProps {
  greenPoints: number;
  onAward: (points: number) => void;
}

export function Challenges({ greenPoints, onAward }: ChallengesProps) {
  const [completed, setCompleted] = useState<string[]>([]);

  const handleComplete = (id: string, points: number) => {
    if (!completed.includes(id)) {
      setCompleted([...completed, id]);
      onAward(points);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Award size={200} />
        </div>
        <div className="relative z-10 flex flex-col items-center">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full w-max mx-auto mb-4 border border-emerald-100 shadow-sm">
              <Award size={36} />
            </div>
            <h2 className="text-3xl font-bold text-slate-800">Gamify Sustainability</h2>
            <p className="text-slate-500 mt-2 max-w-lg mx-auto">
              Join challenges like "Non-carbon weeks" or "Plastic-free challenges". Complete them to earn Green Points and unlock Eco-badges!
            </p>
            <div className="mt-6 flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-md">
                <Leaf size={20} className="text-emerald-400" />
                <span>{greenPoints} Total Green Points</span>
            </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4 px-2">Active Challenges</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {CHALLENGES.map((challenge) => {
             const isCompleted = completed.includes(challenge.id);
             const Icon = challenge.icon;
             
             return (
               <Card key={challenge.id} className={`rounded-[2rem] border-2 transition-all ${isCompleted ? 'border-slate-200 bg-slate-50 opacity-70' : challenge.color.split(' ')[2] + ' shadow-sm hover:shadow-md'}`}>
                 <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                       <div className={`p-3 rounded-2xl ${isCompleted ? 'bg-slate-200 text-slate-400' : challenge.color.split(' ')[1] + ' ' + challenge.color.split(' ')[0]}`}>
                          <Icon size={24} />
                       </div>
                       <div className="text-right">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reward</span>
                          <p className="font-bold text-emerald-600">+{challenge.points} pts</p>
                       </div>
                    </div>
                    <div className="mt-4">
                       <h4 className={`text-lg font-bold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{challenge.title}</h4>
                       <p className="text-slate-500 mt-1 text-sm">{challenge.description}</p>
                    </div>
                    <div className="mt-6">
                       <button
                         onClick={() => handleComplete(challenge.id, challenge.points)}
                         disabled={isCompleted}
                         className={`w-full py-3 rounded-xl font-bold transition-all ${
                           isCompleted 
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                         }`}
                       >
                         {isCompleted ? 'Completed' : 'Mark as Completed'}
                       </button>
                    </div>
                 </CardContent>
               </Card>
             );
          })}
        </div>
      </div>
    </div>
  );
}
