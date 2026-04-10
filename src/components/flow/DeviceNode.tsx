import { Handle, Position, NodeProps } from 'reactflow';

const DeviceNode = ({ data }: NodeProps) => {
  return (
    <div style={{ background: 'white', border: '2px solid blue', padding: 10, borderRadius: 8 }}>
      <div>{data.label}</div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: 'red', width: 20, height: 20, left: -8 }}
      />
    </div>
  );
};

export default DeviceNode;
