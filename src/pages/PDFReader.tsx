import { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Trash2, Upload, FolderOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const PDFReader = () => {
  const { data, addPdfPath, deletePdfPath } = useAppData();
  const [path, setPath] = useState("");
  const [name, setName] = useState("");
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  const handleAddPath = () => {
    if (!path.trim()) {
      toast({
        title: "Missing path",
        description: "Please provide a PDF path",
        variant: "destructive",
      });
      return;
    }

    addPdfPath({
      path: path.trim(),
      name: name.trim() || path.split(/[\\/]/).pop() || "Untitled PDF",
    });

    setPath("");
    setName("");
    toast({
      title: "PDF path saved",
      description: "You can now access this PDF from the list",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      addPdfPath({
        path: url,
        name: file.name,
      });
      toast({
        title: "PDF uploaded",
        description: file.name,
      });
      e.target.value = "";
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const openPdf = (pdfPath: string) => {
    // Try to open in new tab - for file:// paths or blob URLs
    const win = window.open(pdfPath, "_blank");
    if (!win) {
      toast({
        title: "Popup blocked",
        description: "Please allow popups to view PDFs",
        variant: "destructive",
      });
    }
    setSelectedPdf(pdfPath);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 text-foreground">PDF Reader</h1>
            <p className="text-muted-foreground">
              Add PDF paths or upload files to access your reading materials
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Add PDF Path or Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Add PDF</CardTitle>
                <CardDescription>Paste a file path or upload a PDF</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">PDF Name (Optional)</label>
                  <Input
                    placeholder="My Reading Material"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">File Path</label>
                  <Input
                    placeholder="C:\Documents\file.pdf or /home/user/file.pdf"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddPath} className="w-full">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Save Path
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="pdf-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload PDF
                      </p>
                    </div>
                    <input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Saved PDF Paths */}
            <Card>
              <CardHeader>
                <CardTitle>Saved PDFs ({data.pdfPaths.length})</CardTitle>
                <CardDescription>Your PDF library</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {data.pdfPaths.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No PDFs saved yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {data.pdfPaths.map((pdf) => (
                        <Card key={pdf.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1 flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  {pdf.name}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                  {pdf.path}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Added: {new Date(pdf.addedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openPdf(pdf.path)}
                                >
                                  Open
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete PDF?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will remove the saved PDF path from your library. This cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          deletePdfPath(pdf.id);
                                          toast({ title: "PDF removed", description: "Path deleted from library" });
                                        }}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* PDF Viewer (if selected) */}
          {selectedPdf && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>PDF Viewer</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPdf(null)}
                  >
                    Close Preview
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <iframe
                  src={selectedPdf}
                  className="w-full h-[600px] border rounded-lg"
                  title="PDF Viewer"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFReader;
