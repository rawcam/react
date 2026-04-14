// src/pages/FlowEditorPage.tsx
// ... (импорты и начало файла без изменений до компонента FlowEditor)

const FlowEditor: React.FC = () => {
  // ... (все состояния и хуки без изменений)

  const applyEdgeStyleToDevice = useCallback((edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    const deviceNodeId = edge.source; // применяем к устройству-источнику
    const styleToApply = edge.style;
    const dataToApply = {
      hideMainBadge: edge.data?.hideMainBadge,
      hideMarkers: edge.data?.hideMarkers,
      markerFontSize: edge.data?.markerFontSize,
      markerTextColor: edge.data?.markerTextColor,
      markerBorderColor: edge.data?.markerBorderColor,
      markerBorderWidth: edge.data?.markerBorderWidth,
      markerBorderRadius: edge.data?.markerBorderRadius,
      markerBackgroundColor: edge.data?.markerBackgroundColor,
      // ... другие поля при необходимости
    };

    setEdges(eds => eds.map(e => {
      if (e.source === deviceNodeId || e.target === deviceNodeId) {
        updateEdge(e.id, { style: styleToApply });
        return {
          ...e,
          style: styleToApply,
          data: { ...e.data, ...dataToApply },
        } as Edge<CableEdgeData>;
      }
      return e;
    }));
  }, [edges, updateEdge, setEdges]);

  // ... (остальные функции без изменений)

  return (
    <div className={`flow-editor ${theme}`} style={{ height: '100vh', display: 'flex', background: 'var(--bg-page)' }}>
      {/* ... */}
      <Sidebar
        // ... остальные пропсы
        onApplyEdgeStyleToDevice={applyEdgeStyleToDevice}
      />
      {/* ... */}
    </div>
  );
};
