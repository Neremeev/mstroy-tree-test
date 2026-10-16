<script setup lang="ts">
import { ModuleRegistry, type ValueGetterParams } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { TreeStore, type TreeItem } from '../store/TreeStore';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([AllEnterpriseModule]);

interface Row extends TreeItem {
  path: string[];
  category: 'Группа' | 'Элемент';
}

const props = defineProps<{
  dataUrl: string;
  delayMs?: number;
}>();

const store = new TreeStore<TreeItem>();
const loading = ref(true);
const rows = ref<Row[]>([]);
let abortController: AbortController | null = null;

const gridOptions = {
  treeData: true,
  getDataPath: (data: Row) => data.path,
  groupDefaultExpanded: -1,
  animateRows: true,
  rowData: rows.value,
  autoGroupColumnDef: {
    headerName: 'Категория',
    valueGetter: (p: ValueGetterParams) => p.data?.category,
    width: 220,
  },
};

const columnDefs = [
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

const treeOptions = computed(() => ({
  ...gridOptions,
  columnDefs,
}));

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildPath(item: TreeItem): string[] {
  const parents = store.getAllParents(item.id);
  return parents
    .slice()
    .reverse()
    .map((p) => String(p.label ?? p.id));
}

function refreshRows(): void {
  rows.value = store.getAll().map((item) => {
    const children = store.getChildren(item.id);
    return {
      ...item,
      path: buildPath(item),
      category: children.length > 0 ? 'Группа' : 'Элемент',
    };
  });
}

async function loadData(): Promise<void> {
  abortController = new AbortController();
  try {
    await delay(props.delayMs ?? 2000);
    if (abortController?.signal.aborted) {
      return;
    }
    const res = await fetch(props.dataUrl, { signal: abortController.signal });
    const items = (await res.json()) as TreeItem[];
    store.setItems(items);
    refreshRows();
  } finally {
    if (!abortController?.signal.aborted) {
      loading.value = false;
    }
  }
}

onMounted(loadData);
onBeforeUnmount(() => abortController?.abort());
</script>

<template>
  <div class="tree-table">
    <div v-if="loading" class="tree-table__loading">
      <span class="spinner" aria-hidden="true"></span>
      <span>Загрузка данных…</span>
    </div>

    <div v-else class="tree-table__grid ag-theme-quartz">
      <AgGridVue
        class="ag-theme-quartz"
        style="width: 100%; height: 500px"
        :tree-data="treeOptions.treeData"
        :get-data-path="treeOptions.getDataPath"
        :group-default-expanded="treeOptions.groupDefaultExpanded"
        :animate-rows="treeOptions.animateRows"
        :auto-group-column-def="treeOptions.autoGroupColumnDef"
        :column-defs="treeOptions.columnDefs"
        :row-data="rows"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-table {
  min-height: 500px;
}
.tree-table__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 500px;
  color: #555;
  font-size: 16px;
}
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #d0d0d0;
  border-top-color: #06c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.tree-table__grid {
  width: 100%;
  height: 500px;
}
</style>