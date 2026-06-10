import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CarbonActivity } from '@/types';
import { Leaf, Plane, Car, Zap, Droplets, Drumstick, Package, Train, Calculator, Sparkles } from 'lucide-react';

interface ActivityLogProps {
  onAddActivity: (activity: Omit<CarbonActivity, 'id' | 'date'>) => void;
}

const PRESETS = [
  { type: 'transport', title: 'Car commute (Gas)', impact: 5.0, icon: Car },
  { type: 'transport', title: 'Metro/Train commute', impact: 1.2, icon: Train },
  { type: 'transport', title: 'Flight travel (Domestic)', impact: 120.0, icon: Plane },
  { type: 'energy', title: 'Electricity bill (Daily avg)', impact: 2.5, icon: Zap },
  { type: 'water', title: 'Water consumption (Daily)', impact: 0.5, icon: Droplets },
  { type: 'diet', title: 'High-meat diet day', impact: 6.0, icon: Drumstick },
  { type: 'diet', title: 'Plant-based meal', impact: 0.5, icon: Leaf },
  { type: 'shopping', title: 'Online shopping delivery', impact: 2.5, icon: Package },
] as const;

export function ActivityLog({ onAddActivity }: ActivityLogProps) {
  const [customType, setCustomType] = useState<CarbonActivity['type']>('transport');

  // Dynamic States
  const [transportMode, setTransportMode] = useState('car');
  const [distance, setDistance] = useState('');
  
  const [foodType, setFoodType] = useState('pizza');
  const [packaging, setPackaging] = useState('plastic');
  
  const [electricityKwh, setElectricityKwh] = useState('');
  const [waterLiters, setWaterLiters] = useState('');
  const [shoppingType, setShoppingType] = useState('clothing');

  const [computedImpact, setComputedImpact] = useState(0);
  const [futureEffect, setFutureEffect] = useState('');
  const [computedTitle, setComputedTitle] = useState('');

  useEffect(() => {
    let impact = 0;
    let effectMsg = '';
    let title = '';

    if (customType === 'transport') {
      const d = parseFloat(distance) || 0;
      if (transportMode === 'car') { 
        impact = d * 0.25; 
        title = `Car ride (${d}km)`; 
        effectMsg = `Driving ${d}km emits heavily. Our planet's temperature rises with excess CO₂. In the future, using a bus could save ${(impact - (d * 0.1)).toFixed(1)}kg!`; 
      }
      else if (transportMode === 'bus') { 
        impact = d * 0.1; 
        title = `Bus ride (${d}km)`; 
        effectMsg = `Great choice! Public transit is efficient and reduces traffic and smog in our future cities.`; 
      }
      else if (transportMode === 'train') { 
        impact = d * 0.05; 
        title = `Train ride (${d}km)`; 
        effectMsg = `Trains are super eco-friendly! You saved ${(d * 0.25 - impact).toFixed(1)}kg compared to driving, keeping our air cleaner.`; 
      }
      else if (transportMode === 'flight') { 
        impact = d * 0.15; 
        title = `Flight (${d}km)`; 
        effectMsg = `Flights emit a lot at high altitudes. Consider buying carbon offsets to help the planet heal.`; 
      }
    } else if (customType === 'diet') {
      if (foodType === 'meat') { impact += 3.5; title = 'Heavy meat meal'; effectMsg = `Meat production uses vast land and water. Switching to plant-based next time saves tons of resources!`; }
      else if (foodType === 'pizza') { impact += 2.0; title = 'Fast Food / Pizza'; effectMsg = `Yum! But processing takes energy. Supporting local eco-friendly places helps reduce impacts.`; }
      else if (foodType === 'veg') { impact += 0.5; title = 'Plant-based meal'; effectMsg = `Amazing! Plant-based meals keep our forests from being cleared for agriculture.`; }
      
      if (packaging === 'plastic') { impact += 0.8; title += ' (Plastic Box)'; effectMsg += ` Plastic takes hundreds of years to degrade and harms ocean life.`; }
      else if (packaging === 'paper') { impact += 0.2; title += ' (Paper Box)'; effectMsg += ` Paper breaks down faster—good choice! Recycle it to save trees.`; }
      else if (packaging === 'none') { title += ' (No packaging)'; effectMsg += ` Zero packaging is the ultimate win for nature!`; }
    } else if (customType === 'energy') {
      const kwh = parseFloat(electricityKwh) || 0;
      impact = kwh * 0.4;
      title = `Electricity usage (${kwh} kWh)`;
      effectMsg = `Burning fossil fuels for electricity adds greenhouse gases. Consider solar panels or just turning off lights to protect future generations!`;
    } else if (customType === 'water') {
      const l = parseFloat(waterLiters) || 0;
      impact = l * 0.001; // minimal co2, but water waste
      title = `Water usage (${l} Liters)`;
      effectMsg = `Fresh water is scarce. You used ${l}L. Shorter showers keep our rivers and streams flowing!`;
    } else if (customType === 'shopping') {
      if (shoppingType === 'clothing') { impact = 5.0; title = 'Bought Clothing'; effectMsg = `Fast fashion fills landfills quickly. Buying second-hand clothes saves massive water and dye waste.`; }
      else if (shoppingType === 'electronics') { impact = 20.0; title = 'Bought Electronics'; effectMsg = `E-waste is toxic to soil. Try to use electronics for longer and recycle them properly!`; }
      else if (shoppingType === 'household') { impact = 2.0; title = 'Bought Household items'; effectMsg = `Every new item takes energy to make. If it's reusable, that's a big win for the future!`; }
    }

    setComputedImpact(parseFloat(impact.toFixed(2)));
    setComputedTitle(title);
    setFutureEffect(effectMsg);
  }, [customType, transportMode, distance, foodType, packaging, electricityKwh, waterLiters, shoppingType]);

  const handlePreset = (preset: typeof PRESETS[number]) => {
    onAddActivity({
      type: preset.type,
      title: preset.title,
      co2ImpactKg: preset.impact,
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!computedTitle || computedImpact === undefined) return;
    
    onAddActivity({
      type: customType,
      title: computedTitle,
      co2ImpactKg: computedImpact,
    });
    
    // Reset inputs
    setDistance('');
    setElectricityKwh('');
    setWaterLiters('');
  };

  return (
    <div className="space-y-6">
      <Card className="border-emerald-100 shadow-sm rounded-3xl hidden md:block">
        <CardHeader>
          <CardTitle>Quick Log</CardTitle>
          <CardDescription>Add common activities to your footprint</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESETS.map((preset, idx) => {
              const Icon = preset.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handlePreset(preset)}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-left group"
                >
                  <div className="p-3 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-white group-hover:text-emerald-500 transition-colors">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-800">{preset.title}</p>
                    <p className="text-xs text-slate-500">+{preset.impact} kg CO₂</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
             <Calculator size={20} className="text-emerald-500" />
             Smart Tracker
          </CardTitle>
          <CardDescription className="text-sm">Calculate exact impacts & see how it effects our future!</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleCustomSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="custom-type" className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">Select Activity Category</label>
              <select
                id="custom-type"
                value={customType}
                onChange={(e) => setCustomType(e.target.value as any)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-base sm:text-sm"
              >
                <option value="transport">🚗 Transport</option>
                <option value="diet">🍔 Food & Diet</option>
                <option value="energy">⚡ Home Energy</option>
                <option value="water">💧 Water Usage</option>
                <option value="shopping">🛍️ Shopping</option>
              </select>
            </div>

            {/* Dynamic Fields */}
            <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              {customType === 'transport' && (
                 <div className="grid gap-4 sm:grid-cols-2">
                   <div className="space-y-2">
                     <label htmlFor="trans-mode" className="text-sm font-medium text-slate-700">Vehicle Type</label>
                     <select
                       id="trans-mode"
                       value={transportMode}
                       onChange={(e) => setTransportMode(e.target.value)}
                       className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-base sm:text-sm"
                     >
                       <option value="car">Car (Gasoline)</option>
                       <option value="bus">Public Bus</option>
                       <option value="train">Metro / Train</option>
                       <option value="flight">Airplane</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label htmlFor="trans-dist" className="text-sm font-medium text-slate-700">Distance Travelled (km)</label>
                     <input
                       id="trans-dist"
                       type="number"
                       min="0"
                       placeholder="e.g. 15"
                       value={distance}
                       onChange={(e) => setDistance(e.target.value)}
                       className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-base sm:text-sm"
                     />
                   </div>
                 </div>
              )}

              {customType === 'diet' && (
                 <div className="grid gap-4 sm:grid-cols-2">
                   <div className="space-y-2">
                     <label htmlFor="food-type" className="text-sm font-medium text-slate-700">What did you eat?</label>
                     <select
                       id="food-type"
                       value={foodType}
                       onChange={(e) => setFoodType(e.target.value)}
                       className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-base sm:text-sm"
                     >
                       <option value="pizza">Fast Food / Pizza</option>
                       <option value="meat">Heavy Meat Meal (Steak, Beef)</option>
                       <option value="veg">Plant-based / Vegan</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label htmlFor="packaging" className="text-sm font-medium text-slate-700">Packaging</label>
                     <select
                       id="packaging"
                       value={packaging}
                       onChange={(e) => setPackaging(e.target.value)}
                       className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-base sm:text-sm"
                     >
                       <option value="plastic">Plastic Box / Wrappers</option>
                       <option value="paper">Cardboard / Paper box</option>
                       <option value="none">None (Dine-in or Reusable)</option>
                     </select>
                   </div>
                 </div>
              )}

              {customType === 'energy' && (
                 <div className="space-y-2">
                   <label htmlFor="energy-kwh" className="text-sm font-medium text-slate-700">Electricity Used (kWh)</label>
                   <p className="text-[11px] sm:text-xs text-slate-500 mb-1">Tip: 1 hour of Air Conditioning is roughly 1 - 2 kWh.</p>
                   <input
                     id="energy-kwh"
                     type="number"
                     min="0"
                     placeholder="e.g. 5"
                     value={electricityKwh}
                     onChange={(e) => setElectricityKwh(e.target.value)}
                     className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-base sm:text-sm"
                   />
                 </div>
              )}

              {customType === 'water' && (
                 <div className="space-y-2">
                   <label htmlFor="water-L" className="text-sm font-medium text-slate-700">Water Consumption (Liters)</label>
                   <p className="text-[11px] sm:text-xs text-slate-500 mb-1">Tip: A 10-minute shower uses about 100 liters.</p>
                   <input
                     id="water-L"
                     type="number"
                     min="0"
                     placeholder="e.g. 100"
                     value={waterLiters}
                     onChange={(e) => setWaterLiters(e.target.value)}
                     className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-base sm:text-sm"
                   />
                 </div>
              )}
              
              {customType === 'shopping' && (
                 <div className="space-y-2">
                   <label htmlFor="shop-type" className="text-sm font-medium text-slate-700">What did you buy?</label>
                   <select
                     id="shop-type"
                     value={shoppingType}
                     onChange={(e) => setShoppingType(e.target.value)}
                     className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-base sm:text-sm"
                   >
                     <option value="clothing">New Clothing & Shoes</option>
                     <option value="electronics">Electronics</option>
                     <option value="household">Household Items</option>
                   </select>
                 </div>
              )}
            </div>
            
            {/* Realtime Analysis Card */}
            {(distance || electricityKwh || waterLiters || customType === 'diet' || customType === 'shopping') && (
              <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl text-white shadow-lg animate-in fade-in zoom-in duration-300">
                 <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
                      <Sparkles size={20} className="text-green-200" />
                      Impact Analysis
                    </div>
                    <div className="text-right">
                       <span className="text-2xl sm:text-3xl font-black">{computedImpact}</span>
                       <span className="text-emerald-100 font-medium ml-1 text-sm sm:text-base">kg CO₂</span>
                    </div>
                 </div>
                 <div className="bg-white/10 p-3 rounded-xl border border-white/20 mt-2">
                    <p className="text-[13px] sm:text-sm leading-relaxed text-emerald-50 drop-shadow-sm font-medium">{futureEffect}</p>
                 </div>
              </div>
            )}

            <button
              type="submit"
              disabled={computedImpact === 0 && customType !== 'water'} // Water can have tiny/zero impact but still logs
              className="w-full py-3.5 sm:py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors shadow-md disabled:bg-slate-200 disabled:text-slate-400 flex justify-center items-center gap-2 text-[15px] sm:text-base"
            >
              Analyze & Add to Dashboard
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

