import { useAppData } from "@/hooks/useAppData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, BookA, Languages, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Home = () => {
  const { data } = useAppData();

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
