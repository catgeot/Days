import React from 'react';
import CloudPreviewWorkLog from './CloudPreviewWorkLog.jsx';
import CurationHandoffDebugPanel from './CurationHandoffDebugPanel.jsx';
import FlightDebugPanel from './FlightDebugPanel.jsx';
import SeaExploreDebugPanel from './SeaExploreDebugPanel.jsx';

export default function PreviewDebugChrome() {
  return (
    <>
      <CloudPreviewWorkLog />
      <SeaExploreDebugPanel />
      <CurationHandoffDebugPanel />
      <FlightDebugPanel />
    </>
  );
}
