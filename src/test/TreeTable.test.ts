import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TreeTable from '../components/TreeTable.vue';

const testItems = [
  { id: 1, parent: null, label: 'Айтем 1' },
  { id: 2, parent: 1, label: 'Айтем 2' },
  { id: 3, parent: 1, label: 'Айтем 3' },
];

describe('TreeTable.vue', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(testItems), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('показывает состояние загрузки до получения данных', () => {
    const wrapper = mount(TreeTable, {
      props: { dataUrl: '/items.json', delayMs: 0 },
    });
    expect(wrapper.find('.tree-table__loading').exists()).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('загружает данные через fetch, реактивно обновляет строки и скрывает загрузку', async () => {
    const wrapper = mount(TreeTable, {
      props: { dataUrl: '/items.json', delayMs: 0 },
    });

    await vi.advanceTimersByTimeAsync(0);
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('/items.json', expect.any(Object));
    expect(wrapper.find('.tree-table__loading').exists()).toBe(false);
    expect(wrapper.find('.tree-table__grid').exists()).toBe(true);
    wrapper.unmount();
  });
});