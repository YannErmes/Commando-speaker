import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import Reading from "./pages/Reading";
import ReaderPage from "./pages/ReaderPage";
import Vocabulary from "./pages/Vocabulary";
import TongueTwisters from "./pages/TongueTwisters";
import PDFReader from "./pages/PDFReader";
import Settings from "./pages/Settings";
import Goals from "./pages/Goals";
import Flashcards from "./pages/Flashcards";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reading" element={<Reading />} />
          <Route path="/reading/:id" element={<ReaderPage />} />
          <Route path="/vocabulary" element={<Vocabulary />} />
          <Route path="/tongue-twisters" element={<TongueTwisters />} />
          <Route path="/pdf-reader" element={<PDFReader />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/flashcards" element={<Flashcards />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
