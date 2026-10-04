export interface IpoInput {
  id: string;
  name: string;
}

export interface IpoProcess {
  id: string;
  description: string;
}

export interface IpoOutput {
  id: string;
  name: string;
}

export interface IpoFunction {
  id: string;
  name: string;
  inputs: IpoInput[];
  processes: IpoProcess[];
  outputs: IpoOutput[];
}

export interface IpoConnection {
  id: string;
  sourceFunctionId: string;
  sourceOutputId: string;
  targetFunctionId: string;
  targetInputId: string;
  label?: string;
}

export interface IpoProjectData {
  projectName: string;
  functions: IpoFunction[];
  connections: IpoConnection[];
}

export interface IpoValidationError {
  type: 'function' | 'connection';
  id: string;
  field?: 'name' | 'inputs' | 'processes' | 'outputs' | 'reference';
  message: string;
}
