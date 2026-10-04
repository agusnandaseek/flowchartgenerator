import type { IpoFunction, IpoConnection, IpoValidationError } from '../types/ipoChart';

export function validateIpoProject(
  functions: IpoFunction[],
  connections: IpoConnection[]
): {
  errors: IpoValidationError[];
  functionErrors: Record<string, string[]>;
  connectionErrors: Record<string, string>;
} {
  const errors: IpoValidationError[] = [];
  const functionErrors: Record<string, string[]> = {};
  const connectionErrors: Record<string, string> = {};

  const functionMap = new Map<string, IpoFunction>();
  const outputMap = new Map<string, Set<string>>();
  const inputMap = new Map<string, Set<string>>();

  // 1. Validate each function
  functions.forEach((fn) => {
    functionMap.set(fn.id, fn);
    const fnErrs: string[] = [];

    const fnOutputs = Array.isArray(fn.outputs) ? fn.outputs : [];
    const fnInputs = Array.isArray(fn.inputs) ? fn.inputs : [];
    const fnProcesses = Array.isArray(fn.processes)
      ? fn.processes
      : Array.isArray((fn as unknown as { process: unknown[] }).process)
      ? (fn as unknown as { process: unknown[] }).process
      : [];

    const outIds = new Set<string>();
    fnOutputs.forEach((o) => {
      if (o && o.id) outIds.add(o.id);
    });
    outputMap.set(fn.id, outIds);

    const inIds = new Set<string>();
    fnInputs.forEach((i) => {
      if (i && i.id) inIds.add(i.id);
    });
    inputMap.set(fn.id, inIds);

    // Function name required
    if (!fn.name || !fn.name.trim()) {
      const msg = 'Function name is required.';
      fnErrs.push(msg);
      errors.push({ type: 'function', id: fn.id, field: 'name', message: msg });
    }

    // At least one input
    if (fnInputs.length === 0) {
      const msg = 'At least one input is required.';
      fnErrs.push(msg);
      errors.push({ type: 'function', id: fn.id, field: 'inputs', message: msg });
    }

    // At least one process
    if (fnProcesses.length === 0) {
      const msg = 'At least one process is required.';
      fnErrs.push(msg);
      errors.push({ type: 'function', id: fn.id, field: 'processes', message: msg });
    }

    // At least one output
    if (fnOutputs.length === 0) {
      const msg = 'At least one output is required.';
      fnErrs.push(msg);
      errors.push({ type: 'function', id: fn.id, field: 'outputs', message: msg });
    }

    if (fnErrs.length > 0) {
      functionErrors[fn.id] = fnErrs;
    }
  });

  // 2. Validate each connection
  connections.forEach((conn) => {
    const srcFn = functionMap.get(conn.sourceFunctionId);
    const tgtFn = functionMap.get(conn.targetFunctionId);

    const srcOutputs = outputMap.get(conn.sourceFunctionId);
    const tgtInputs = inputMap.get(conn.targetFunctionId);

    const isSrcValid = srcFn && srcOutputs && srcOutputs.has(conn.sourceOutputId);
    const isTgtValid = tgtFn && tgtInputs && tgtInputs.has(conn.targetInputId);

    if (!isSrcValid || !isTgtValid) {
      const msg = 'Connection contains an invalid reference.';
      connectionErrors[conn.id] = msg;
      errors.push({ type: 'connection', id: conn.id, field: 'reference', message: msg });
    }
  });

  return { errors, functionErrors, connectionErrors };
}
