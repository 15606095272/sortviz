import { codeFor, codeText, loadLang, normalizeLang, saveLang, CODE_LANGS, LANG_STORAGE_KEY, type CodeBook, type CodeLangLine } from '../../src/core/code';

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

describe('按方向取行文本 codeText', () => {
  const line: CodeLangLine = { text: 'while (j >= 0 && a[j] > key) {', descText: 'while (j >= 0 && a[j] < key) {', anchor: 4 };
  const plain: CodeLangLine = { text: 'int key = a[i];', anchor: 2 };

  it('升序恒用 text（哪怕声明了 descText）', () => {
    expect(codeText(line, 'asc')).toBe(line.text);
    expect(codeText(plain, 'asc')).toBe(plain.text);
  });

  it('降序有 descText 就用它', () => {
    expect(codeText(line, 'desc')).toBe(line.descText);
  });

  it('未声明 descText 的行，降序也用 text（原文不变）', () => {
    expect(codeText(plain, 'desc')).toBe(plain.text);
  });
});
