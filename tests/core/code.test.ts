import { codeFor, codeText, loadLang, normalizeLang, saveLang, CODE_LANGS, LANG_STORAGE_KEY, type CodeBook, type CodeLangLine, type CodeView } from '../../src/core/code';

describe('代码语言', () => {
  it('normalizeLang：只认 cpp/java/python，其余回退 c', () => {
    expect(normalizeLang('cpp')).toBe('cpp');
    expect(normalizeLang('java')).toBe('java');
    expect(normalizeLang('python')).toBe('python');
    expect(normalizeLang('c')).toBe('c');
    expect(normalizeLang(null)).toBe('c');
    expect(normalizeLang('rust')).toBe('c');
  });

  it('四种语言齐全且顺序固定', () => {
    expect([...CODE_LANGS]).toEqual(['c', 'cpp', 'java', 'python']);
  });

  it('codeFor 取对应语言的行', () => {
    const book: CodeBook = {
      c: [{ text: 'int main() {}' }],
      cpp: [{ text: 'int main() { return 0; }' }],
      java: [{ text: 'class A {}' }],
      python: [{ text: 'pass' }],
    };
    expect(codeFor(book, 'java')[0].text).toBe('class A {}');
  });

  it('loadLang 从存储恢复', () => {
    expect(loadLang({ getItem: (k) => (k === LANG_STORAGE_KEY ? 'python' : null) })).toBe('python');
  });

  it('loadLang：乱值与异常都回退 c', () => {
    expect(loadLang({ getItem: () => 'rust' })).toBe('c');
    expect(loadLang({ getItem: () => { throw new Error('x'); } })).toBe('c');
  });

  it('saveLang 写键；异常不冒泡', () => {
    const written: Array<[string, string]> = [];
    saveLang('java', { setItem: (k, v) => written.push([k, v]) });
    expect(written).toEqual([[LANG_STORAGE_KEY, 'java']]);
    expect(() => saveLang('c', { setItem: () => { throw new Error('x'); } })).not.toThrow();
  });
});

describe('按方向与下标进制取行文本 codeText', () => {
  // 四种覆盖都声明了的行：用于验证「1 基·降序」优先级最高的是 descText1
  const line: CodeLangLine = {
    text: '        while (j >= 0 && a[j] > key) {',
    descText: '        while (j >= 0 && a[j] < key) {',
    text1: '        while (j >= 1 && a[j] > key) {',
    descText1: '        while (j >= 1 && a[j] < key) {',
    anchor: 4,
  };
  // 什么都没声明：四种组合都必须回落原文
  const plain: CodeLangLine = { text: 'int key = a[i];', anchor: 2 };
  // 只有进制会变（下标下界），与方向无关
  const baseOnly: CodeLangLine = { text: 'int low = 0, high = i - 1;', text1: 'int low = 1, high = i - 1;', anchor: 3 };
  // 只有方向会变（比较符），与下标进制无关
  const dirOnly: CodeLangLine = { text: 'if (a[mid] <= key) {', descText: 'if (a[mid] >= key) {', anchor: 6 };

  const view = (order: 'asc' | 'desc', base: 0 | 1): CodeView => ({ order, base });

  it('0 基·升序恒用 text（与改造前逐字一致，哪怕声明了 descText/text1/descText1）', () => {
    expect(codeText(line, view('asc', 0))).toBe(line.text);
    expect(codeText(plain, view('asc', 0))).toBe(plain.text);
    expect(codeText(baseOnly, view('asc', 0))).toBe(baseOnly.text);
    expect(codeText(dirOnly, view('asc', 0))).toBe(dirOnly.text);
  });

  it('0 基·降序用 descText；没声明 descText 的行仍用 text', () => {
    expect(codeText(line, view('desc', 0))).toBe(line.descText);
    expect(codeText(dirOnly, view('desc', 0))).toBe(dirOnly.descText);
    expect(codeText(plain, view('desc', 0))).toBe(plain.text);
    expect(codeText(baseOnly, view('desc', 0))).toBe(baseOnly.text);
  });

  it('1 基·升序用 text1；没声明 text1 的行仍用 text', () => {
    expect(codeText(line, view('asc', 1))).toBe(line.text1);
    expect(codeText(baseOnly, view('asc', 1))).toBe(baseOnly.text1);
    expect(codeText(plain, view('asc', 1))).toBe(plain.text);
    // 只随方向变的行在 1 基·升序仍是原文（文本里没有下标，换进制不该改它）
    expect(codeText(dirOnly, view('asc', 1))).toBe(dirOnly.text);
  });

  it('1 基·降序优先 descText1（既换进制又反方向的行）', () => {
    expect(codeText(line, view('desc', 1))).toBe(line.descText1);
    expect(codeText(line, view('desc', 1))).not.toBe(line.descText);
    expect(codeText(line, view('desc', 1))).not.toBe(line.text1);
  });

  it('只有 text1 的行：1 基·降序 取 text1（不会退化成 0 基的 text）', () => {
    expect(codeText(baseOnly, view('desc', 1))).toBe(baseOnly.text1);
    expect(codeText(baseOnly, view('desc', 1))).not.toBe(baseOnly.text);
  });

  it('只有 descText 的行：1 基·降序 回落 descText（方向仍要反）', () => {
    expect(codeText(dirOnly, view('desc', 1))).toBe(dirOnly.descText);
  });

  it('什么都没声明的行：四种组合都是 text', () => {
    for (const order of ['asc', 'desc'] as const) {
      for (const base of [0, 1] as const) {
        expect(codeText(plain, view(order, base))).toBe(plain.text);
      }
    }
  });
});
