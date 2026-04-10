import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FlowEditorPage from './pages/FlowEditorPage';

function App() {
  return (
    <BrowserRouter basename="/reactflow">
      <Routes>
        <Route path="/" element={<Navigate to="/flow-editor" replace />} />
        <Route path="/flow-editor" element={<FlowEditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
