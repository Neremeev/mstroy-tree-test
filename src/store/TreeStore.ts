import type { TreeId, TreeItem } from './types';

export type { TreeId, TreeItem } from './types';

/** Нормализованный (строковый) ключ, используемый для внутренних индексов. */
const keyOf = (id: TreeId): string => String(id);

/**
 * Класс-хранилище элементов дерева.
 *
 * Проектировался под максимальное быстродействие: при операциях используется
 * минимальное количество обходов массива, а для доступа к элементам применяются
 * индексные Map'ы (прямой доступ за O(1)):
 *
 * - `byId`   — id элемента -> сам элемент;
 * - `childrenByParent` — ключ родителя -> массив id прямых дочерних элементов.
 *
 * Индексы перестраиваются за один проход массива при `setItems`.
 *
 * Тип `T` расширяет `TreeItem`, что позволяет хранить произвольные поля и
 * сохранять их типы (например `label: string`).
 */
export class TreeStore<T extends TreeItem = TreeItem> {
  private byId = new Map<string, T>();
  private childrenByParent = new Map<string, TreeId[]>();

  /**
   * @param items Исходный массив элементов. По умолчанию пустой массив.
   */
  constructor(items: T[] = []) {
    this.setItems(items);
  }

  /**
   * Возвращает полный массив элементов хранилища.
   * Гарантирует возврат НОВОГО массива, чтобы внешние мутации не влияли
   * на внутреннее состояние хранилища.
   */
  getAll(): T[] {
    return [...this.byId.values()];
  }

  /**
   * Возвращает объект элемента по его id, либо `null`, если элемента нет.
   */
  getItem(id: TreeId): T | null {
    return this.byId.get(keyOf(id)) ?? null;
  }

  /**
   * Возвращает массив элементов, являющихся прямыми дочерними для элемента
   * с переданным id. Если дочерних нет — пустой массив.
   */
  getChildren(id: TreeId): T[] {
    const ids = this.childrenByParent.get(keyOf(id));
    if (!ids) {
      return [];
    }
    return ids.map((childId) => this.byId.get(keyOf(childId))!).filter(Boolean);
  }

  /**
   * Возвращает массив элементов, состоящий из прямых дочерних элементов
   * переданного элемента и всех их потомков до самого глубокого уровня.
   * Обход в ширину: сначала прямые дети, затем их потомки и так далее.
   */
  getAllChildren(id: TreeId): T[] {
    const result: T[] = [];
    const queue: T[] = [...this.getChildren(id)];
    let index = 0;

    while (index < queue.length) {
      const item = queue[index++];
      result.push(item);
      queue.push(...this.getChildren(item.id));
    }

    return result;
  }

  /**
   * Возвращает массив из цепочки родительских элементов, начиная от самого
   * элемента, чей id передан в аргументе, и до корневого элемента дерева.
   * Порядок элементов ВАЖЕН: от самого элемента вверх к корню.
   */
  getAllParents(id: TreeId): T[] {
    const result: T[] = [];
    let current = this.getItem(id);
    const seen = new Set<string>();

    while (current && !seen.has(keyOf(current.id))) {
      seen.add(keyOf(current.id));
      result.push(current);
      const parentId = current.parent;
      if (parentId === null) {
        break;
      }
      current = this.getItem(parentId);
    }

    return result;
  }

  /**
   * Полностью заменяет данные хранилища переданным массивом элементов.
   * Старые элементы не сохраняются. Индексы перестраиваются за один проход.
   */
  setItems(items: T[]): void {
    const byId = new Map<string, T>();
    const childrenByParent = new Map<string, TreeId[]>();

    for (const item of items) {
      byId.set(keyOf(item.id), item);

      if (item.parent !== null) {
        const parentKey = keyOf(item.parent);
        const list = childrenByParent.get(parentKey);
        if (list) {
          list.push(item.id);
        } else {
          childrenByParent.set(parentKey, [item.id]);
        }
      }
    }

    this.byId = byId;
    this.childrenByParent = childrenByParent;
  }

  /**
   * Добавляет новый элемент в хранилище.
   * Если элемент с таким id уже существует, он будет перезаписан.
   */
  addItem(item: T): void {
    const idKey = keyOf(item.id);
    this.byId.set(idKey, item);

    if (item.parent !== null) {
      const parentKey = keyOf(item.parent);
      const list = this.childrenByParent.get(parentKey);
      if (list) {
        list.push(item.id);
      } else {
        this.childrenByParent.set(parentKey, [item.id]);
      }
    }
  }

  /**
   * Удаляет элемент по его id, а также все его дочерние элементы (рекурсивно).
   */
  removeItem(id: TreeId): void {
    const idKey = keyOf(id);

    const toRemove = new Set<string>([idKey]);
    for (const child of this.getAllChildren(id)) {
      toRemove.add(keyOf(child.id));
    }

    for (const removeKey of toRemove) {
      this.byId.delete(removeKey);
      this.childrenByParent.delete(removeKey);
    }

    const newChildrenByParent = new Map<string, TreeId[]>();
    for (const [parentKey, childIds] of this.childrenByParent) {
      const filtered = childIds.filter((childId) => !toRemove.has(keyOf(childId)));
      if (filtered.length > 0) {
        newChildrenByParent.set(parentKey, filtered);
      }
    }
    this.childrenByParent = newChildrenByParent;
  }

  /**
   * Обновляет существующий элемент в хранилище.
   * Если элемент с таким id не существует — ничего не делает.
   *
   * При изменении поля `parent` у элемента корректно перестраивает индексы
   * дочерних связей.
   */
  updateItem(item: T): void {
    const idKey = keyOf(item.id);
    const existing = this.byId.get(idKey);
    if (!existing) {
      return;
    }

    const prevParentKey = existing.parent !== null ? keyOf(existing.parent) : null;
    const nextParentKey = item.parent !== null ? keyOf(item.parent) : null;

    this.byId.set(idKey, item);

    if (prevParentKey === nextParentKey) {
      return;
    }

    if (prevParentKey !== null) {
      const prevList = this.childrenByParent.get(prevParentKey);
      if (prevList) {
        const filtered = prevList.filter((childId) => keyOf(childId) !== idKey);
        if (filtered.length > 0) {
          this.childrenByParent.set(prevParentKey, filtered);
        } else {
          this.childrenByParent.delete(prevParentKey);
        }
      }
    }

    if (nextParentKey !== null) {
      const nextList = this.childrenByParent.get(nextParentKey);
      if (nextList) {
        nextList.push(item.id);
      } else {
        this.childrenByParent.set(nextParentKey, [item.id]);
      }
    }
  }
}