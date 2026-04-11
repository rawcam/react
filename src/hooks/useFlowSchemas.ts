import { useState, useCallback } from 'react';
import { Node, Edge } from 'reactflow';
import { DeviceNodeData, CableEdgeData, SavedSchema } from '../types/flowTypes';

export const useFlowSchemas = () => {
  const [schemas, setSchemas] = useState<SavedSchema[]>([]);
  const [currentSchemaId, setCurrentSchemaId] = useState<string | null>(null);
  const [schemaName, setSchemaName] = useState('Новая схема');

  const saveCurrentSchema = useCallback((nodes: Node<DeviceNodeData>[], edges: Edge<CableEdgeData>[]) => {
    if (!schemaName) return;
    const newSchema: SavedSchema = {
      id: currentSchemaId || Date.now().toString(),
      name: schemaName,
      nodes,
      edges,
    };
    setSchemas(prev => {
      const exists = prev.find(s => s.id === newSchema.id);
      if (exists) {
        return prev.map(s => s.id === newSchema.id ? newSchema : s);
      }
      return [...prev, newSchema];
    });
    setCurrentSchemaId(newSchema.id);
  }, [schemaName, currentSchemaId]);

  const loadSchema = useCallback((id: string) => {
    const schema = schemas.find(s => s.id === id);
    if (schema) {
      setCurrentSchemaId(schema.id);
      setSchemaName(schema.name);
      return schema;
    }
    return null;
  }, [schemas]);

  const newSchema = useCallback(() => {
    setCurrentSchemaId(null);
    setSchemaName('Новая схема');
    return { nodes: [], edges: [] };
  }, []);

  const importSchema = useCallback((schema: SavedSchema) => {
    setSchemas(prev => {
      const exists = prev.find(s => s.id === schema.id);
      if (exists) {
        return prev.map(s => s.id === schema.id ? schema : s);
      }
      return [...prev, schema];
    });
    setCurrentSchemaId(schema.id);
    setSchemaName(schema.name);
    return schema;
  }, []);

  return {
    schemas,
    currentSchemaId,
    schemaName,
    setSchemaName,
    saveCurrentSchema,
    loadSchema,
    newSchema,
    importSchema,
  };
};
