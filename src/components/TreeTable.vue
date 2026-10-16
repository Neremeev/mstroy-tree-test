<script setup lang="ts">
import { ModuleRegistry } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { TreeStore, type TreeItem } from '../store/TreeStore';
import { columnDefs, gridOptions, type Row, type TreeTableProps } from './treeTableConfig';
import './treeTable.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const props = defineProps<TreeTableProps>();

const store = new TreeStore<TreeItem>();
const loading = ref(true);
const rows = ref<Row[]>([]);
let abortController: AbortController | null = null;

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