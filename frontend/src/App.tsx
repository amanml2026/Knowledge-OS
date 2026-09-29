import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import KnowledgeGraph from './pages/KnowledgeGraph';

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-background text-textMain overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/knowledge" element={<KnowledgeGraph />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
