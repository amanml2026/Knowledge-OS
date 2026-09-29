import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

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

function KnowledgeGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch data from API
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
          });
      });
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
  }, []);

  return (
    <div className="h-full w-full flex flex-col p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white">Knowledge Graph</h2>
        <p className="text-textMuted">Visualize how concepts interconnect and your current mastery.</p>
      </div>
      
      <div className="flex-1 bg-surface rounded-xl border border-white/5 overflow-hidden" ref={containerRef}>
        {graphData.nodes.length > 0 ? (
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
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default KnowledgeGraph;
