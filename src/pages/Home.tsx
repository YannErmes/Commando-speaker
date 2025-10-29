import { useAppData } from "@/hooks/useAppData";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, BookA, Languages, TrendingUp, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Home = () => {
  const { data } = useAppData();

  // Persistent session timer stored in localStorage so it keeps running across sections
  const TIMER_BASE_KEY = 'fln:sessionTimerBase'; // seconds
  const TIMER_LAST_START_KEY = 'fln:sessionTimerLastStart'; // ms timestamp or null

  const [elapsed, setElapsed] = useState<number>(() => {
    try {
      const base = parseInt(localStorage.getItem(TIMER_BASE_KEY) || '0', 10) || 0;
      const last = parseInt(localStorage.getItem(TIMER_LAST_START_KEY) || '0', 10) || 0;
      if (last) {
        const extra = Math.floor((Date.now() - last) / 1000);
        return base + extra;
      }
      return base;
    } catch {
      return 0;
    }
  });

  const intervalRef = useRef<number | null>(null);

  const isRunning = () => {
    return !!(localStorage.getItem(TIMER_LAST_START_KEY));
  };

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const startTimer = () => {
    try {
      if (!localStorage.getItem(TIMER_LAST_START_KEY)) {
        localStorage.setItem(TIMER_LAST_START_KEY, String(Date.now()));
      }
    } catch {}
    // ensure UI updates
    startTick();
  };

  const pauseTimer = () => {
    try {
      const last = parseInt(localStorage.getItem(TIMER_LAST_START_KEY) || '0', 10) || 0;
      const base = parseInt(localStorage.getItem(TIMER_BASE_KEY) || '0', 10) || 0;
      if (last) {
        const extra = Math.floor((Date.now() - last) / 1000);
        localStorage.setItem(TIMER_BASE_KEY, String(base + extra));
      }
      localStorage.removeItem(TIMER_LAST_START_KEY);
    } catch {}
    stopTick();
    // update displayed elapsed from storage
    try {
      const base = parseInt(localStorage.getItem(TIMER_BASE_KEY) || '0', 10) || 0;
      setElapsed(base);
    } catch {
      // ignore
    }
  };

  const resetTimer = () => {
    try {
      localStorage.removeItem(TIMER_LAST_START_KEY);
      localStorage.setItem(TIMER_BASE_KEY, '0');
    } catch {}
    stopTick();
    setElapsed(0);
  };

  const startTick = () => {
    // clear any existing tick
    stopTick();
    // fast update first
    try {
      const base = parseInt(localStorage.getItem(TIMER_BASE_KEY) || '0', 10) || 0;
      const last = parseInt(localStorage.getItem(TIMER_LAST_START_KEY) || '0', 10) || 0;
      const current = last ? base + Math.floor((Date.now() - last) / 1000) : base;
      setElapsed(current);
    } catch {
      // ignore
    }
    intervalRef.current = window.setInterval(() => {
      try {
        const base = parseInt(localStorage.getItem(TIMER_BASE_KEY) || '0', 10) || 0;
        const last = parseInt(localStorage.getItem(TIMER_LAST_START_KEY) || '0', 10) || 0;
        const current = last ? base + Math.floor((Date.now() - last) / 1000) : base;
        setElapsed(current);
      } catch {
        // ignore
      }
    }, 1000) as unknown as number;
  };

  const stopTick = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    // Start ticking if timer was running when component mounts
    if (isRunning()) startTick();
    // listen for storage events so multiple tabs update the display
    const onStorage = (e: StorageEvent) => {
      if (e.key === TIMER_BASE_KEY || e.key === TIMER_LAST_START_KEY) {
        try {
          const base = parseInt(localStorage.getItem(TIMER_BASE_KEY) || '0', 10) || 0;
          const last = parseInt(localStorage.getItem(TIMER_LAST_START_KEY) || '0', 10) || 0;
          const current = last ? base + Math.floor((Date.now() - last) / 1000) : base;
          setElapsed(current);
          if (last) startTick(); else stopTick();
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      stopTick();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const stats = [
    {
      icon: BookA,
      label: "Saved Texts",
      value: data.texts.length,
      description: "Reading materials",
      to: "/reading",
    },
    {
      icon: Languages,
      label: "Vocabulary",
      value: data.vocab.length,
      description: "Words & sentences",
      to: "/vocabulary",
    },
    {
      icon: CalendarDays,
      label: "Used Today",
      value: data.vocab.reduce((sum, v) => {
        const today = new Date().toISOString().split('T')[0];
        return sum + (v.usageHistory?.[today] || 0);
      }, 0),
      description: "Words marked used today",
      to: "/vocabulary",
    },
    {
      icon: TrendingUp,
      label: "Practiced",
      value: data.tongueTwisters.filter((tt) => tt.practiced).length,
      description: "Tongue twisters completed",
      to: "/tongue-twisters",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Book className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-foreground">Welcome to LangLearn</h1>
            <p className="text-xl text-muted-foreground">
              Your personal language learning companion
            </p>
            {/* Persistent session timer */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="font-mono bg-muted/10 px-3 py-1 rounded text-sm">{formatTime(elapsed)}</div>
              <Button size="sm" onClick={() => {
                if (localStorage.getItem('fln:sessionTimerLastStart')) {
                  pauseTimer();
                } else {
                  startTimer();
                }
              }}>
                {localStorage.getItem('fln:sessionTimerLastStart') ? 'Pause' : 'Start'}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetTimer}>Reset</Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.label}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <p className="text-sm text-muted-foreground mb-3">{stat.description}</p>
                    <Link to={stat.to}>
                      <Button variant="outline" size="sm" className="w-full">
                        View
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookA className="h-5 w-5" />
                  Reading Section
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Paste texts and build vocabulary interactively
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-4">
                  <li>• Double-click words to add to vocabulary</li>
                  <li>• Select sentences for context</li>
                  <li>• Track what you've learned</li>
                </ul>
                <Link to="/reading">
                  <Button variant="secondary" className="w-full">
                    Start Reading
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-accent text-accent-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Tongue Twisters
                </CardTitle>
                <CardDescription className="text-accent-foreground/80">
                  Practice pronunciation with 45+ twisters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-4">
                  <li>• Filter by target sound</li>
                  <li>• See IPA pronunciation</li>
                  <li>• Adjustable playback speed</li>
                </ul>
                <Link to="/tongue-twisters">
                  <Button variant="secondary" className="w-full">
                    Practice Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
