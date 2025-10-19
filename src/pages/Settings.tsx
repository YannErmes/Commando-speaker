import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { exportData, importData, resetData } from "@/lib/storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const { data, setData } = useAppData();

  const handleExport = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `langlearn-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Your data has been downloaded",
    });
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (importData(content)) {
          // Force reload from localStorage
          window.location.reload();
          toast({
            title: "Import successful",
            description: "Your data has been restored",
          });
        } else {
          toast({
            title: "Import failed",
            description: "Invalid data format",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    resetData();
    window.location.reload();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your data and preferences</p>
          </div>

          <div className="space-y-6">
            {/* Data Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Data Overview</CardTitle>
                <CardDescription>Your current learning data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{data.texts.length}</div>
                    <div className="text-sm text-muted-foreground">Saved Texts</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{data.vocab.length}</div>
                    <div className="text-sm text-muted-foreground">Vocabulary Items</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">
                      {data.tongueTwisters.filter((tt) => tt.practiced).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Practiced Twisters</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export/Import */}
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Backup and restore your learning progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <Download className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Export Data</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download all your texts, vocabulary, and progress as a JSON file
                    </p>
                    <Button onClick={handleExport} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export to JSON
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <Upload className="h-5 w-5 text-accent mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Import Data</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Restore your data from a previously exported JSON file
                    </p>
                    <Button onClick={handleImport} variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import from JSON
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reset Data */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions - use with caution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <Trash2 className="h-5 w-5 text-destructive mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">Reset All Data</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Delete all your texts, vocabulary, and progress. This cannot be undone.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Reset Everything
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all your
                            saved texts, vocabulary entries, and tongue-twister progress.
                            <br />
                            <br />
                            Consider exporting your data first as a backup.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleReset}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, delete everything
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">LangLearn</strong> is a client-side language
                  learning tool that helps you build vocabulary through reading and improve
                  pronunciation with tongue twisters.
                </p>
                <p>All data is stored locally in your browser using localStorage.</p>
                <p>Version 1.0.0</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
