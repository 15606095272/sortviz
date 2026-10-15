import { renderPassTable } from '../../src/ui/pass-table';
import { COPY } from '../../src/copy/zh';
import type { PassRecord } from '../../src/core/replay';

const passes: PassRecord[] = [
  { pass: 1, data: [38, 49] },
  { pass: 2, data: [49, 38] },
];

describe('每趟结果表', () => {
  it('表头是「趟次 / 序列」', () => {
    const host = document.createElement('div');
    renderPassTable(host, [49, 38], [], null);
    expect([...host.querySelectorAll('th')].map((t) => t.textContent)).toEqual([
      COPY.tableHeadPass,
      COPY.tableHeadSeq,
    ]);
  });

  it('首行是「初始」+ 初始序列（等宽类）', () => {
    const host = document.createElement('div');
    renderPassTable(host, [49, 38], [], null);
    const rows = host.querySelectorAll('tr');
    expect(rows[1].textContent).toContain(COPY.initial);
    expect(rows[1].querySelector('.mono')!.textContent).toBe('49 38');
  });

  it('每个 pass 一行，趟次文案来自 COPY.pass', () => {
    const host = document.createElement('div');
    renderPassTable(host, [49, 38], passes, null);
    const rows = [...host.querySelectorAll('tr')].slice(1);
    expect(rows).toHaveLength(3);
    expect(rows[1].textContent).toContain('第 1 趟');
    expect(rows[2].querySelector('.mono')!.textContent).toBe('49 38');
  });

  it('activePass 命中行加 .now，且恰好一行', () => {
    const host = document.createElement('div');
    renderPassTable(host, [49, 38], passes, 2);
    const now = host.querySelectorAll('tr.now');
    expect(now).toHaveLength(1);
    expect(now[0].textContent).toContain('第 2 趟');
  });

  it('一趟都没走完时显示提示，但初始行仍在', () => {
    const host = document.createElement('div');
    renderPassTable(host, [7, 3], [], null);
    expect(host.textContent).toContain(COPY.emptyPasses);
    // 表头 + 初始行 + 提示行
    expect(host.querySelectorAll('tr')).toHaveLength(3);
    expect(host.querySelector('tr.empty')!.textContent).toContain(COPY.emptyPasses);
  });

  it('重复渲染先清空再建，不累积', () => {
    const host = document.createElement('div');
    renderPassTable(host, [49, 38], [], null);
    renderPassTable(host, [49, 38], passes, null);
    expect(host.querySelectorAll('table')).toHaveLength(1);
    expect(host.querySelectorAll('tr')).toHaveLength(4);
  });
});
