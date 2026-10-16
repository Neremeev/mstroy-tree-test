/**
 * Базовый тип элемента дерева.
 *
 * Обязательными являются поля `id` и `parent`, остальные поля произвольные
 * (например `label`). `id` и `parent` могут быть числом или строкой.
 * `parent === null` означает корневой элемент.
 */
export type TreeId = number | string;

export interface TreeItem {
  id: TreeId;
  parent: TreeId | null;
  [key: string]: unknown;
}