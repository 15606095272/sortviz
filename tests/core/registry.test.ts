import { registerAlgorithm, registerView, listAlgorithms, getAlgorithm, getView, resetRegistry } from '../../src/core/registry';
import { registerBuiltinAlgorithms } from '../../src/algorithms';
import { createViewState } from '../../src/core/replay';

const fakeAlgo = {
  id: 'fake', name: { zh: '假算法', en: 'Fake' }, category: 'insert' as const,
  stable: true, complexity: { best: '-', avg: '-', worst: '-', space: '-' },
  pseudocode: [{ line: 1, indent: 0, text: 'noop' }], defaultViews: ['array'] as const,
  run: (data: number[]) => [],
};

describe('注册表', () => {
  beforeEach(() => resetRegistry());

  it('注册后可按 id 取回，列表按注册顺序', () => {
    registerAlgorithm(fakeAlgo);
    expect(listAlgorithms().map((a) => a.id)).toEqual(['fake']);
    expect(getAlgorithm('fake').name.zh).toBe('假算法');
  });

  it('重复 id 抛错', () => {
    registerAlgorithm(fakeAlgo);
    expect(() => registerAlgorithm(fakeAlgo)).toThrow(/重复/);
  });

  it('未知 id 抛错并列出可选 id', () => {
    registerAlgorithm(fakeAlgo);
    expect(() => getAlgorithm('nope')).toThrow(/fake/);
  });

  it('视图重复注册抛错，未知视图返回 undefined 不抛错', () => {
    const view = { kind: 'array' as const, mount: () => {}, render: () => {}, destroy: () => {} };
    registerView(view);
    expect(() => registerView(view)).toThrow(/重复/);
    expect(getView('bar')).toBeUndefined();
  });

  it('每个已注册算法的元数据完整（自动覆盖当前全部算法）', () => {
    registerBuiltinAlgorithms();
    const algos = listAlgorithms();
    expect(algos.length).toBeGreaterThanOrEqual(3);
    for (const algo of algos) {
      const lines = algo.pseudocode.map((l) => l.line);
      expect(new Set(lines).size).toBe(lines.length);       // 行号唯一
      expect(algo.defaultViews.length).toBeGreaterThan(0);  // 至少一个默认视图
      expect(Array.isArray(algo.run([3, 1, 2]))).toBe(true);
    }
  });

  it('内置注册后 9 种算法齐全且顺序固定（插入/折半插入/希尔/冒泡/快排/选择/堆/归并/基数）', () => {
    registerBuiltinAlgorithms();
    expect(listAlgorithms().map((a) => a.id)).toEqual([
      'insertion', 'binary-insertion', 'shell', 'bubble', 'quick', 'selection', 'heap', 'merge', 'radix',
    ]);
  });

  it('每个内置算法的伪代码行号唯一且 cover 到默认视图', () => {
    registerBuiltinAlgorithms();
    for (const algo of listAlgorithms()) {
      const lines = algo.pseudocode.map((l) => l.line);
      expect(new Set(lines).size).toBe(lines.length);
      expect(algo.defaultViews.length).toBeGreaterThan(0);
      expect(createViewState([1]).data).toEqual([1]);      // 夹具可用
    }
  });
});
