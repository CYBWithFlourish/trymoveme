import React, { useRef, useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import axios from 'axios';

export default function Home() {
  const [code, setCode] = useState('// Write your Move exploit here...\n');
  const [isBuilding, setIsBuilding] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (termRef.current && !xtermRef.current) {
      const term = new Terminal({
        theme: { background: '#1e1e1e' },
        cols: 80,
        rows: 24,
      });
      term.open(termRef.current);
      term.writeln('TryMoveMe Terminal initialized.');
      term.writeln('Waiting for execution...');
      xtermRef.current = term;
    }
  }, []);

  const handleRun = async () => {
    if (!xtermRef.current) return;
    setIsBuilding(true);
    setResult(null);
    xtermRef.current.clear();
    xtermRef.current.writeln('$ sui move build...');
    
    try {
      // Mocking the Start Session to get a containerId
      xtermRef.current.writeln('Allocating sandbox session...');
      const startRes = await axios.post('http://localhost:3000/lab/start', {
         roomId: 'room_1',
         userMnemonic: 'dummy mvp tester mnemonic'
      });
      xtermRef.current.writeln(`Found container ${startRes.data.containerId}. Formatting code...`);
      
      const submitRes = await axios.post('http://localhost:3000/lab/submit', {
         userId: '0x_dummy_user',
         containerId: startRes.data.containerId,
         code: code,
      });

      const { output, status, txHash, blobId } = submitRes.data;
      xtermRef.current.writeln(output);
      
      setResult({ status, txHash, blobId });
      xtermRef.current.writeln(`Status check returning: ${status}`);
    } catch (err: any) {
      xtermRef.current.writeln(`\x1b[31mError running code:\x1b[0m ${err.message}`);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#121212', color: 'white' }}>
      <header style={{ padding: '1rem', borderBottom: '1px solid #333' }}>
        <h1 style={{margin: 0}}>TryMoveMe Labs 🛡️</h1>
        <p style={{margin: '0.2rem 0', color: '#aaaaaa'}}>Room 1: Hot Potato Exploit</p>
      </header>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{fontFamily: 'monospace'}}>editor.move</span>
              <button 
                  onClick={handleRun} 
                  disabled={isBuilding}
                  style={{ padding: '0.5rem 1rem', background: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {isBuilding ? 'Running in Sandbox...' : 'Execute Exploit'}
              </button>
           </div>
           <Editor
             height="100%"
             defaultLanguage="rust"
             theme="vs-dark"
             value={code}
             onChange={(val) => setCode(val || '')}
             options={{ minimap: { enabled: false } }}
           />
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <h3>Terminal / Console</h3>
          <div ref={termRef} style={{ width: '100%', height: '300px' }} />
          
          {result && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#1e1e1e' }}>
              <h4>Mission Status: {result.status === 'WIN' ? '✅ SEALED' : '❌ FAILED'}</h4>
              {result.txHash && <p><strong>Proof Mined (Sui TX):</strong> {result.txHash}</p>}
              {result.blobId && <p><strong>Walrus Artifact ID:</strong> {result.blobId}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
