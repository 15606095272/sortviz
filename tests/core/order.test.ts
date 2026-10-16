import { less, more, normalizeOrder, loadOrder, saveOrder, sortedBy, ORDER_STORAGE_KEY } from '../../src/core/order';

describe('排序方向', () => {
  it('normalizeOrder：只认 desc，其余回退 asc', () => {
    expect(normalizeOrder('desc')).toBe('desc');
    expect(normalizeOrder('asc')).toBe('asc');
    expect(normalizeOrder(null)).toBe('asc');
    expect(normalizeOrder('up')).toBe('asc');
  });

  it('less/more 在两种方向下互为镜像', () => {
    expect(less(1, 2, 'asc')).toBe(true);
    expect(less(1, 2, 'desc')).toBe(false);
    expect(more(1, 2, 'asc')).toBe(false);
    expect(more(1, 2, 'desc')).toBe(true);
    expect(less(2, 2, 'asc')).toBe(false);
    expect(more(2, 2, 'desc')).toBe(false);
  });

  it('sortedBy 给出该方向的目标结果', () => {
    expect(sortedBy([49, 38, 65], 'asc')).toEqual([38, 49, 65]);
    expect(sortedBy([49, 38, 65], 'desc')).toEqual([65, 49, 38]);
  });

  it('loadOrder 从存储恢复；乱值/异常回退 asc', () => {
    expect(loadOrder({ getItem: (k) => (k === ORDER_STORAGE_KEY ? 'desc' : null) })).toBe('desc');
    expect(loadOrder({ getItem: () => 'neon' })).toBe('asc');
    expect(loadOrder({ getItem: () => { throw new Error('x'); } })).toBe('asc');
  });

  it('saveOrder 写键；异常不冒泡', () => {
    const written: Array<[string, string]> = [];
    saveOrder('desc', { setItem: (k, v) => written.push([k, v]) });
    expect(written).toEqual([[ORDER_STORAGE_KEY, 'desc']]);
    expect(() => saveOrder('asc', { setItem: () => { throw new Error('x'); } })).not.toThrow();
  });

  it('默认方向就是升序（既有黄金夹具口径）', () => {
    expect(normalizeOrder(undefined)).toBe('asc');
  });
});
