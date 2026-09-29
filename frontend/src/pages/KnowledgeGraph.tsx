import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Share2, Plus } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  val: number;
  color: string;
  mastery: number;
}

interface Link {
  source: string;
  target: string;
}

export default function KnowledgeGraph() {
  const [graphData, setGraphData] = useState<{nodes: Node[], links: Link[]}>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newConceptTitle, setNewConceptTitle] = useState('');

  const fetchGraph = () => {
    setIsLoading(true);
    fetch('http://localhost:8000/api/concepts/')
      .then(res => res.json())
      .then(concepts => {
        const nodes = concepts.map((c: any) => ({
          id: c.id.toString(),
          name: c.title,
          val: 20,
          mastery: c.mastery_level,
          color: c.mastery_level > 0.8 ? '#10B981' : c.mastery_level > 0.5 ? '#3B82F6' : '#F59E0B'
        }));
        
        fetch('http://localhost:8000/api/relationships/')
          .then(res => res.json())
          .then(rels => {
            const links = rels.map((r: any) => ({
              source: r.prerequisite_id.toString(),
              target: r.dependent_id.toString()
            }));
            setGraphData({ nodes, links });
            setIsLoading(false);
          });
      })
      .catch(err => {
         console.error("Failed to fetch graph data", err);
         setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoading]);

  const handleAddConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConceptTitle.trim()) return;
    
    try {
      await fetch('http://localhost:8000/api/concepts/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newConceptTitle,
          explanation: "Newly created concept.",
          difficulty: 0.5
        })
      });
      setNewConceptTitle('');
      setShowAddModal(false);
      fetchGraph(); // Refresh the graph
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // EMPTY STATE
  if (graphData.nodes.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto h-full flex flex-col justify-center">
        <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Knowledge Base</h2>
          <p className="text-textMuted max-w-md mx-auto mb-8">
            Create your first subject or concept to start building your knowledge graph.
          </p>
          <div className="flex justify-center gap-4">
             <button 
               onClick={() => setShowAddModal(true)}
               className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
             >
               <Plus className="w-4 h-4" />
               Create Concept
             </button>
          </div>
        </div>
        
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
             <div className="bg-surface p-6 rounded-xl w-full max-w-md border border-white/10">
               <h3 className="text-xl font-bold text-white mb-4">New Concept</h3>
               <form onSubmit={handleAddConcept}>
                 <input 
                   autoFocus
                   type="text" 
                   value={newConceptTitle}
                   onChange={e => setNewConceptTitle(e.target.value)}
                   placeholder="Concept Title (e.g., Linear Algebra)" 
                   className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-4 text-white mb-4 focus:border-primary focus:outline-none"
                 />
                 <div className="flex justify-end gap-2">
                   <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-textMuted hover:text-white">Cancel</button>
                   <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-medium">Save</button>
                 </div>
               </form>
             </div>
          </div>
        )}
      </div>
    );
  }

  // GRAPH VIEW
  return (
    <div className="h-full w-full flex flex-col p-6 relative">
      <div className="mb-4 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-6 h-6 text-primary" />
            Knowledge Graph
          </h2>
          <p className="text-textMuted">Visualize how concepts interconnect and your current mastery.</p>
        </div>
        <button 
           onClick={() => setShowAddModal(true)}
           className="bg-surface hover:bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Concept
        </button>
      </div>
      
      <div className="flex-1 bg-surface rounded-xl border border-white/5 overflow-hidden" ref={containerRef}>
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          nodeColor="color"
          nodeRelSize={6}
          linkColor={() => 'rgba(255,255,255,0.2)'}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          d3VelocityDecay={0.3}
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
           <div className="bg-surface p-6 rounded-xl w-full max-w-md border border-white/10 shadow-2xl">
             <h3 className="text-xl font-bold text-white mb-4">New Concept</h3>
             <form onSubmit={handleAddConcept}>
               <input 
                 autoFocus
                 type="text" 
                 value={newConceptTitle}
                 onChange={e => setNewConceptTitle(e.target.value)}
                 placeholder="Concept Title" 
                 className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-4 text-white mb-4 focus:border-primary focus:outline-none"
               />
               <div className="flex justify-end gap-2">
                 <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-textMuted hover:text-white">Cancel</button>
                 <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg font-medium">Save</button>
               </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}
