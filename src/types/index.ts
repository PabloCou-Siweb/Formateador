// Tipos para las columnas de la tabla
export interface Column {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  width?: number;
  visible: boolean;
  order: number;
  alignment?: 'left' | 'center' | 'right';
}

// Tipos para los datos de la tabla
export type CellValue = string | number | boolean | Date | null;

export interface TableData {
  _rowId?: string; // ID único de la fila
  [key: string]: CellValue | string | undefined;
}

// Configuración de formato
export interface FormatConfig {
  fontSize: number;
  headerBgColor: string;
  headerTextColor: string;
  rowBgColor: string;
  alternateRowBgColor: string;
  borderColor: string;
  borderWidth: number;
  padding: number;
  showBorders: boolean;
  alternateRows: boolean;
}

// Configuración de exportación
export interface ExportConfig {
  format: 'csv' | 'json' | 'excel' | 'html';
  fileName: string;
  includeHeaders: boolean;
}

// Estado de la aplicación
export interface AppState {
  columns: Column[];
  data: TableData[];
  formatConfig: FormatConfig;
  currentStep: number;
}


