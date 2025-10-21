
import React from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

const defaultActions = ["Break into steps", "Track progress", "Review at week's end"];

const Goals = () => {
  const { data, addGoal, updateGoal } = useAppData();
  const goals = data.goals || [];
  const local = goals.slice(0,3).map(g => g.text);
  const [vals, setVals] = React.useState<string[]>(local.length ? local : ['','','']);
  const [actions, setActions] = React.useState<string[][]>([
    [""], [""], [""]
  ]);
  const [checked, setChecked] = React.useState<boolean[][]>([
    [false, false, false], [false, false, false], [false, false, false]
  ]);

  React.useEffect(() => {
    setActions([
      [...defaultActions],
      [...defaultActions],
      [...defaultActions]
    ]);
  }, []);

  const handleSave = () => {
    for (let i = 0; i < 3; i++) {
      const text = vals[i] || '';
      const g = goals[i];
      if (g) updateGoal(g.id, { text });
      else if (text.trim()) addGoal({ text });
    }
    toast({ title: 'Goals saved' });
  };

  const handleActionCheck = (goalIdx: number, actionIdx: number) => {
    setChecked(prev => {
      const arr = prev.map(a => [...a]);
      arr[goalIdx][actionIdx] = !arr[goalIdx][actionIdx];
      return arr;
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl">Weekly Goals Mind Map</CardTitle>
              <CardDescription className="text-sm">Visualize your goals and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-8 py-6">
                <div className="flex flex-col sm:flex-row gap-8 w-full justify-center">
                  {[0,1,2].map(i => (
                    <div key={i} className="flex flex-col items-center w-full">
                      <div className="rounded-full bg-primary/10 border border-primary/30 px-4 py-2 mb-2 w-full text-center">
                        <Input value={vals[i]||''} onChange={(e) => { const arr=[...vals]; arr[i]=e.target.value; setVals(arr); }} placeholder={`Goal ${i+1}`} className="text-center font-bold text-lg" />
                      </div>
                      <div className="flex flex-col gap-2 w-full items-center">
                        {actions[i].map((action, j) => (
                          <label key={j} className="flex items-center gap-2 w-full">
                            <span className="w-2 h-2 rounded-full bg-primary/40 inline-block" />
                            <Checkbox checked={checked[i][j]} onCheckedChange={() => handleActionCheck(i, j)} />
                            <span className="text-sm">{action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-6">
                  <Button onClick={handleSave}>Save Goals</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Goals;
