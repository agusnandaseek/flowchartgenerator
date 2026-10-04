import { TerminatorNode } from './TerminatorNode';
import { ProcessNode } from './ProcessNode';
import { InputOutputNode } from './InputOutputNode';
import { DecisionNode } from './DecisionNode';

export const nodeTypes = {
  terminator: TerminatorNode,
  process: ProcessNode,
  inputOutput: InputOutputNode,
  decision: DecisionNode,
};

export { TerminatorNode, ProcessNode, InputOutputNode, DecisionNode };
