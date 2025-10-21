import React from 'react';
import { useAppData } from '@/hooks/useAppData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const Goals = () => {
  const { data, addGoal, updateGoal } = useAppData();
  const goals = data.goals || [];
  const local = goals.slice(0,3).map(g => g.text);
  const [vals, setVals] = React.useState<string[]>(local.length ? local : ['','','']);

  const handleSave = () => {
    for (let i = 0; i < 3; i++) {
      const text = vals[i] || '';
      const g = goals[i];
      if (g) updateGoal(g.id, { text });
      else if (text.trim()) addGoal({ text });
    }
    toast({ title: 'Goals saved' });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Goals</CardTitle>
              <CardDescription>Set up to 3 goals for the week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              { [0,1,2].map(i => (
                <Input key={i} value={vals[i]||''} onChange={(e) => { const arr=[...vals]; arr[i]=e.target.value; setVals(arr); }} placeholder={`Goal ${i+1}`} />
              ))}
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save Goals</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Goals;
