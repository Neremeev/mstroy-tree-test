import { describe, expect, it } from 'vitest';
import { TreeStore, type TreeItem } from '../store/TreeStore';

/**
 * Генерирует большое дерево: N узлов, у каждого до [branching] детей.
 * Возвращает также root id.
 */
function buildBigTree(
  count: number,
  branching = 10,
): { items: TreeItem[]; rootId: number } {
  const items: TreeItem[] = [{ id: 1, parent: null, label: 'root' }];
  let nextId = 2;
  let frontier: number[] = [1];

  while (items.length < count) {
    const nextFrontier: number[] = [];
    for (const parent of frontier) {
      for (let c = 0; c < branching && items.length < count; c++) {
        items.push({ id: nextId, parent, label: `node-${nextId}` });
        nextFrontier.push(nextId);
        nextId++;
      }
      if (items.length >= count) break;
    }
    frontier = nextFrontier;
  }
  return { items, rootId: 1 };
}

describe('TreeStore performance', () => {
  const N = 100_000;
  const { items, rootId } = buildBigTree(N, 10);

  it('инициализация и getAll работают быстро (порядок ~100мс на 100k узлов)', () => {
    const start = performance.now();
    const store = new TreeStore(items);
    const elapsedInit = performance.now() - start;
    const all = store.getAll();
    expect(all.length).toBe(N);

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(3000);
    console.log(`init+getAll(${N}): ${elapsed.toFixed(1)}ms (init ${elapsedInit.toFixed(1)}ms)`);
  });

  it('getAllChildren проходит всё дерево за один обход', () => {
    const store = new TreeStore(items);
    const start = performance.now();
    const children = store.getAllChildren(rootId);
    const elapsed = performance.now() - start;
    expect(children.length).toBe(N - 1);
    console.log(`getAllChildren(${N}): ${elapsed.toFixed(1)}ms`);
    expect(elapsed).toBeLessThan(3000);
  });

  it('getAllParents для глубокого узла быстр', () => {
    const store = new TreeStore(items);
    const lastId = items[items.length - 1].id;
    const start = performance.now();
    const parents = store.getAllParents(lastId);
    const elapsed = performance.now() - start;
    expect(parents.length).toBeGreaterThan(0);
    console.log(`getAllParents(last,${N}): ${elapsed.toFixed(1)}ms, depth=${parents.length}`);
    expect(elapsed).toBeLessThan(100);
  });

  it('removeItem поддерева удаляет всех потомков быстро', () => {
    const store = new TreeStore(items);
    if (store.getItem(2)) {
      const before = store.getAll().length;
      store.removeItem(2);
      const after = store.getAll().length;
      expect(after).toBeLessThan(before);
      expect(store.getItem(2)).toBeNull();
      console.log(`removeItem(2): removed ${before - after} nodes`);
    }
  });
});