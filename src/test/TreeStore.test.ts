import { describe, expect, it } from 'vitest';
import { TreeStore, type TreeItem } from '../store/TreeStore';

interface Item extends TreeItem {
  id: number | string;
  parent: number | string | null;
  label: string;
}

const items: Item[] = [
  { id: 1, parent: null, label: 'Айтем 1' },
  { id: '91064cef', parent: 1, label: 'Айтем 2' },
  { id: 3, parent: 1, label: 'Айтем 3' },
  { id: 4, parent: '91064cef', label: 'Айтем 4' },
  { id: 5, parent: '91064cef', label: 'Айтем 5' },
  { id: 6, parent: '91064cef', label: 'Айтем 6' },
  { id: 7, parent: 4, label: 'Айтем 7' },
  { id: 8, parent: 4, label: 'Айтем 8' },
];

const store = () => new TreeStore<Item>(items);

describe('TreeStore', () => {
  it('getAll возвращает полный массив элементов', () => {
    const s = store();
    expect(s.getAll().length).toBe(items.length);
    expect(s.getAll().map((i) => i.label)).toEqual(items.map((i) => i.label));
  });

  it('getItem возвращает объект по id', () => {
    const s = store();
    expect(s.getItem(1)).toEqual({ id: 1, parent: null, label: 'Айтем 1' });
    expect(s.getItem('91064cef')).toEqual({ id: '91064cef', parent: 1, label: 'Айтем 2' });
    expect(s.getItem(999)).toBeNull();
  });

  it('getChildren возвращает прямых дочерних элементов', () => {
    const s = store();
    expect(s.getChildren(1).map((i) => i.id)).toEqual([1, '91064cef', 3].slice(1));
    expect(s.getChildren('91064cef').map((i) => i.id)).toEqual([4, 5, 6]);
    expect(s.getChildren(4).map((i) => i.id)).toEqual([7, 8]);
    expect(s.getChildren(8)).toEqual([]);
    expect(s.getChildren(12345)).toEqual([]);
  });

  it('getAllChildren возвращает всех потомков до самого глубокого уровня', () => {
    const s = store();
    const allOf1 = s.getAllChildren(1).map((i) => i.id);
    expect(allOf1).toEqual([1, '91064cef', 3, 4, 5, 6, 7, 8].slice(1));

    const allOf4 = s.getAllChildren(4).map((i) => i.id);
    expect(allOf4).toEqual([7, 8]);

    expect(s.getAllChildren(7)).toEqual([]);
  });

  it('getAllParents возвращает путь от элемента до корня (включая сам элемент)', () => {
    const s = store();
    expect(s.getAllParents(7).map((i) => i.id)).toEqual([7, 4, '91064cef', 1]);
    expect(s.getAllParents(1).map((i) => i.id)).toEqual([1]);
    expect(s.getAllParents(8).map((i) => i.id)).toEqual([8, 4, '91064cef', 1]);
  });

  it('setItems полностью заменяет данные', () => {
    const s = store();
    s.setItems([{ id: 100, parent: null, label: 'Новый' }]);
    expect(s.getAll().map((i) => i.id)).toEqual([100]);
    expect(s.getItem(1)).toBeNull();
  });

  it('addItem добавляет новый элемент в структуру', () => {
    const s = store();
    s.addItem({ id: 9, parent: 1, label: 'Айтем 9' });
    expect(s.getItem(9)).toEqual({ id: 9, parent: 1, label: 'Айтем 9' });
    expect(s.getChildren(1).map((i) => i.id)).toContain(9);
  });

  it('removeItem удаляет элемент и всех его потомков', () => {
    const s = store();
    s.removeItem('91064cef');
    expect(s.getItem('91064cef')).toBeNull();
    expect(s.getItem(4)).toBeNull();
    expect(s.getItem(7)).toBeNull();
    expect(s.getChildren(1).map((i) => i.id)).toEqual([1, 3].slice(1));
  });

  it('removeItem корня удаляет все', () => {
    const s = store();
    s.removeItem(1);
    expect(s.getAll()).toEqual([]);
  });

  it('updateItem актуализирует данные и корректно перестраивает индексы при смене parent', () => {
    const s = store();
    s.updateItem({ id: 4, parent: 1, label: 'Айтем 4 (перемещён)' });
    expect(s.getChildren('91064cef').map((i) => i.id)).toEqual([5, 6]);
    expect(s.getChildren(1).map((i) => i.id)).toContain(4);
    expect(s.getItem(4)?.label).toBe('Айтем 4 (перемещён)');
  });

  it('updateItem не создаёт дубликат при обновлении без смены parent', () => {
    const s = store();
    s.updateItem({ id: 5, parent: '91064cef', label: 'Айтем 5 v2' });
    expect(s.getItem(5)?.label).toBe('Айтем 5 v2');
    expect(s.getChildren('91064cef').map((i) => i.id)).toEqual([4, 5, 6]);
  });

  it('updateItem для несуществующего id ничего не делает', () => {
    const s = store();
    s.updateItem({ id: 555, parent: null, label: 'нет' });
    expect(s.getItem(555)).toBeNull();
    expect(s.getAll().length).toBe(items.length);
  });
});