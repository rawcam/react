import { useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { SavedSchema, DeviceNodeData, CableEdgeData } from '../types/flowTypes';

export const useFlowSchemas = () => {
  const [schemas, setSchemas] = useState<SavedSchema[]>([]);
  const [currentSchemaId, setCurrentSchemaId] = useState<string | null>(null);
  const [schemaName, setSchemaName] = useState('Новая схема');

  useEffect(() => {
    const saved = localStorage.getItem('flow_schemas');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSchemas(parsed);
      } catch (e) {}
    }
  }, []);

  const saveSchemasList = (list: SavedSchema[]) => {
    setSchemas(list);
    localStorage.setItem('flow_schemas', JSON.stringify(list));
  };

  const saveCurrentSchema = (nodes: Node<DeviceNodeData>[], edges: Edge<CableEdgeData>[]) => {
    if (!currentSchemaId) {
      const newId = Date.now().toString();
      const newSchema: SavedSchema = {
        id: newId,
        name: schemaName,
        nodes,
        edges,
      };
      saveSchemasList([...schemas, newSchema]);
      setCurrentSchemaId(newId);
    } else {
      const updated = schemas.map(s => s.id === currentSchemaId ? { ...s, name: schemaName, nodes, edges } : s);
      saveSchemasList(updated);
    }
    alert('Схема сохранена');
  };

  const loadSchema = (id: string): { nodes: Node<DeviceNodeData>[]; edges: Edge<CableEdgeData>[] } | null => {
    const schema = schemas.find(s => s.id === id);
    if (schema) {
      setCurrentSchemaId(schema.id);
      setSchemaName(schema.name);
      return { nodes: schema.nodes, edges: schema.edges };
    }
    return null;
  };

  const newSchema = () => {
    setCurrentSchemaId(null);
    setSchemaName('Новая схема');
    return { nodes: [], edges: [] };
  };

  return {
    schemas,
    currentSchemaId,
    schemaName,
    setSchemaName,
    saveCurrentSchema,
    loadSchema,
    newSchema,
  };
};
