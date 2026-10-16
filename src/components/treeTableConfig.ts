import type { ValueGetterParams } from 'ag-grid-community';
import type { TreeItem } from '../store/TreeStore';

/** Строка таблицы: элемент дерева + служебные поля для режима tree data. */
export interface Row extends TreeItem {
  path: string[];
  category: 'Группа' | 'Элемент';
}

/** Пропсы компонента TreeTable. */
export interface TreeTableProps {
  dataUrl: string;
  delayMs?: number;
}

/** Базовые опции грида (режим дерева + авто-групповая колонка «Категория»). */
export const gridOptions = {
  treeData: true,
  getDataPath: (data: Row) => data.path,
  groupDefaultExpanded: -1,
  animateRows: true,
  autoGroupColumnDef: {
    headerName: 'Категория',
    valueGetter: (p: ValueGetterParams) => p.data?.category,
    width: 220,
  },
};

/** Явные колонки таблицы. */
export const columnDefs = [
  {
    headerName: '№ п/п',
    valueGetter: (p: ValueGetterParams) => (p.node?.rowIndex ?? 0) + 1,
    width: 90,
    pinned: false,
    sortable: false,
    suppressSizeToFit: true,
  },
  {
    headerName: 'Наименование',
    field: 'label',
    flex: 1,
  },
];