import type { PythonExecutionResult, PythonVariableSnapshot } from '../types';

// Safe, deterministic Python-subset interpreter for Dasar Pemrograman (13 modules)

interface PyTuple {
  __pyType: 'tuple';
  items: PyValue[];
}

interface PySet {
  __pyType: 'set';
  items: PyValue[];
}

interface PyDict {
  __pyType: 'dict';
  entries: Map<string, { key: PyValue; value: PyValue }>;
}

interface PyFunction {
  __pyType: 'function';
  name: string;
  params: { name: string; defaultExpr?: ExprNode }[];
  body: StmtNode[];
  closure: Env;
  isLambda?: boolean;
  lambdaExpr?: ExprNode;
}

interface PyBuiltin {
  __pyType: 'builtin';
  name: string;
  fn: (args: PyValue[], kwargs: Record<string, PyValue>) => PyValue;
}

interface PyClass {
  __pyType: 'class';
  name: string;
  parent: PyClass | null;
  methods: Map<string, PyFunction>;
  classAttrs: Map<string, PyValue>;
}

interface PyInstance {
  __pyType: 'instance';
  cls: PyClass;
  attrs: Map<string, PyValue>;
}

interface PyBoundMethod {
  __pyType: 'bound_method';
  instance: PyInstance;
  fn: PyFunction;
  cls: PyClass;
}

interface PySuperProxy {
  __pyType: 'super';
  instance: PyInstance;
  parentClass: PyClass;
}

interface PyModule {
  __pyType: 'module';
  name: string;
  exports: Map<string, PyValue>;
}

type PyValue =
  | number
  | string
  | boolean
  | null
  | PyValue[]
  | PyTuple
  | PySet
  | PyDict
  | PyFunction
  | PyBuiltin
  | PyClass
  | PyInstance
  | PyBoundMethod
  | PySuperProxy
  | PyModule;

class PyRuntimeError extends Error {
  pyType: string;
  line?: number;
  constructor(pyType: string, message: string, line?: number) {
    super(message);
    this.pyType = pyType;
    this.line = line;
  }
}

class ReturnSignal {
  value: PyValue;
  constructor(value: PyValue) {
    this.value = value;
  }
}

class BreakSignal {}
class ContinueSignal {}

class Env {
  values = new Map<string, PyValue>();
  parent: Env | null;
  constructor(parent: Env | null = null) {
    this.parent = parent;
  }
  get(name: string, line?: number): PyValue {
    if (this.values.has(name)) return this.values.get(name)!;
    if (this.parent) return this.parent.get(name, line);
    throw new PyRuntimeError('NameError', `Nama variabel atau fungsi '${name}' tidak didefinisikan`, line);
  }
  hasLocal(name: string): boolean {
    return this.values.has(name);
  }
  set(name: string, val: PyValue) {
    this.values.set(name, val);
  }
}

// --- Helpers for Python semantics ---

function isObj(v: PyValue): v is Exclude<PyValue, number | string | boolean | null | PyValue[]> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function getPyTypeName(v: PyValue): string {
  if (v === null) return 'NoneType';
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float';
  if (typeof v === 'string') return 'str';
  if (Array.isArray(v)) return 'list';
  if (isObj(v)) {
    switch (v.__pyType) {
      case 'tuple': return 'tuple';
      case 'set': return 'set';
      case 'dict': return 'dict';
      case 'function':
      case 'builtin':
      case 'bound_method':
        return 'function';
      case 'class': return 'type';
      case 'instance': return v.cls.name;
      case 'module': return 'module';
      default: return 'object';
    }
  }
  return 'object';
}

function pyKeyHash(k: PyValue): string {
  if (typeof k === 'string') return `s:${k}`;
  if (typeof k === 'number') return `n:${k}`;
  if (typeof k === 'boolean') return `b:${k}`;
  if (k === null) return 'none';
  if (isObj(k) && k.__pyType === 'tuple') {
    return `t:(${k.items.map(pyKeyHash).join(',')})`;
  }
  return `o:${formatPyRepr(k)}`;
}

function pyEquals(a: PyValue, b: PyValue): boolean {
  if (a === b) return true;
  if (typeof a === 'boolean' && typeof b === 'number') return (a ? 1 : 0) === b;
  if (typeof a === 'number' && typeof b === 'boolean') return a === (b ? 1 : 0);
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => pyEquals(item, b[i]));
  }
  if (isObj(a) && isObj(b) && a.__pyType === b.__pyType) {
    if (a.__pyType === 'tuple' && b.__pyType === 'tuple') {
      return a.items.length === b.items.length && a.items.every((item, i) => pyEquals(item, b.items[i]));
    }
    if (a.__pyType === 'set' && b.__pyType === 'set') {
      return a.items.length === b.items.length && a.items.every((item) => b.items.some((x) => pyEquals(x, item)));
    }
    if (a.__pyType === 'dict' && b.__pyType === 'dict') {
      if (a.entries.size !== b.entries.size) return false;
      for (const [k, entry] of a.entries.entries()) {
        const other = b.entries.get(k);
        if (!other || !pyEquals(entry.value, other.value)) return false;
      }
      return true;
    }
  }
  return false;
}

function isTruthy(v: PyValue): boolean {
  if (v === null || v === false) return false;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (isObj(v)) {
    if (v.__pyType === 'tuple' || v.__pyType === 'set') return v.items.length > 0;
    if (v.__pyType === 'dict') return v.entries.size > 0;
  }
  return true;
}

function formatPyRepr(v: PyValue): string {
  if (v === null) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') {
    if (Object.is(v, -0)) return '0';
    return String(v);
  }
  if (typeof v === 'string') return `'${v}'`;
  if (Array.isArray(v)) return `[${v.map(formatPyRepr).join(', ')}]`;
  if (isObj(v)) {
    switch (v.__pyType) {
      case 'tuple':
        return v.items.length === 1
          ? `(${formatPyRepr(v.items[0])},)`
          : `(${v.items.map(formatPyRepr).join(', ')})`;
      case 'set':
        return v.items.length === 0 ? 'set()' : `{${v.items.map(formatPyRepr).join(', ')}}`;
      case 'dict': {
        const parts: string[] = [];
        for (const entry of v.entries.values()) {
          parts.push(`${formatPyRepr(entry.key)}: ${formatPyRepr(entry.value)}`);
        }
        return `{${parts.join(', ')}}`;
      }
      case 'function':
        return `<function ${v.name}>`;
      case 'builtin':
        return `<built-in function ${v.name}>`;
      case 'class':
        return `<class '${v.name}'>`;
      case 'instance': {
        const pairs: string[] = [];
        for (const [k, val] of v.attrs.entries()) {
          pairs.push(`${k}=${formatPyRepr(val)}`);
        }
        return `${v.cls.name}(${pairs.join(', ')})`;
      }
      case 'module':
        return `<module '${v.name}'>`;
      default:
        return '<object>';
    }
  }
  return String(v);
}

function formatPyStr(v: PyValue): string {
  if (typeof v === 'string') return v;
  return formatPyRepr(v);
}

function makeSet(items: PyValue[]): PySet {
  const unique: PyValue[] = [];
  for (const item of items) {
    if (!unique.some((existing) => pyEquals(existing, item))) {
      unique.push(item);
    }
  }
  return { __pyType: 'set', items: unique };
}

function toIterable(v: PyValue, line?: number): PyValue[] {
  if (Array.isArray(v)) return [...v];
  if (typeof v === 'string') return v.split('');
  if (isObj(v)) {
    if (v.__pyType === 'tuple') return [...v.items];
    if (v.__pyType === 'set') return [...v.items];
    if (v.__pyType === 'dict') return Array.from(v.entries.values()).map((e) => e.key);
  }
  throw new PyRuntimeError('TypeError', `Objek bertipe '${getPyTypeName(v)}' tidak dapat diiterasi`, line);
}

// --- Tokenizer for Expressions ---

type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'FSTRING'
  | 'IDENT'
  | 'OP'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'LBRACE'
  | 'RBRACE'
  | 'COMMA'
  | 'COLON'
  | 'DOT'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

const TWO_CHAR_OPS = new Set(['==', '!=', '<=', '>=', '//', '**']);
const KEYWORDS = new Set(['and', 'or', 'not', 'in', 'is', 'True', 'False', 'None', 'lambda', 'if', 'else', 'for']);

function tokenizeExpr(src: string, line?: number): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      i++;
      continue;
    }
    if (ch === '#') break;

    // f-string
    if ((ch === 'f' || ch === 'F') && (src[i + 1] === '"' || src[i + 1] === "'")) {
      const quote = src[i + 1];
      i += 2;
      let val = '';
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\' && i + 1 < src.length) {
          const next = src[i + 1];
          val += next === 'n' ? '\n' : next === 't' ? '\t' : next;
          i += 2;
        } else {
          val += src[i++];
        }
      }
      if (src[i] !== quote) throw new PyRuntimeError('SyntaxError', 'String f-string tidak ditutup dengan tanda kutip', line);
      i++;
      tokens.push({ type: 'FSTRING', value: val });
      continue;
    }

    // String
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let val = '';
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\' && i + 1 < src.length) {
          const next = src[i + 1];
          val += next === 'n' ? '\n' : next === 't' ? '\t' : next;
          i += 2;
        } else {
          val += src[i++];
        }
      }
      if (src[i] !== quote) throw new PyRuntimeError('SyntaxError', 'String tidak ditutup dengan tanda kutip', line);
      i++;
      tokens.push({ type: 'STRING', value: val });
      continue;
    }

    // Number
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      let num = '';
      let hasDot = false;
      while (i < src.length && (/[0-9]/.test(src[i]) || (src[i] === '.' && !hasDot))) {
        if (src[i] === '.') hasDot = true;
        num += src[i++];
      }
      tokens.push({ type: 'NUMBER', value: num });
      continue;
    }

    // Identifier / keyword
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < src.length && /[a-zA-Z0-9_]/.test(src[i])) {
        ident += src[i++];
      }
      tokens.push({ type: KEYWORDS.has(ident) ? 'OP' : 'IDENT', value: ident });
      continue;
    }

    const two = src.slice(i, i + 2);
    if (TWO_CHAR_OPS.has(two)) {
      tokens.push({ type: 'OP', value: two });
      i += 2;
      continue;
    }

    if ('+-*/%<>=|&'.includes(ch)) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    const singleMap: Record<string, TokenType> = {
      '(': 'LPAREN',
      ')': 'RPAREN',
      '[': 'LBRACKET',
      ']': 'RBRACKET',
      '{': 'LBRACE',
      '}': 'RBRACE',
      ',': 'COMMA',
      ':': 'COLON',
      '.': 'DOT',
    };
    if (singleMap[ch]) {
      tokens.push({ type: singleMap[ch], value: ch });
      i++;
      continue;
    }

    throw new PyRuntimeError('SyntaxError', `Karakter tidak dikenali '${ch}'`, line);
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// --- AST Nodes ---

type ExprNode =
  | { kind: 'literal'; value: number | string | boolean | null }
  | { kind: 'fstring'; raw: string }
  | { kind: 'var'; name: string }
  | { kind: 'unary'; op: string; expr: ExprNode }
  | { kind: 'binary'; op: string; left: ExprNode; right: ExprNode }
  | { kind: 'compare'; left: ExprNode; ops: string[]; comparators: ExprNode[] }
  | { kind: 'ternary'; test: ExprNode; body: ExprNode; orelse: ExprNode }
  | { kind: 'lambda'; params: string[]; body: ExprNode }
  | { kind: 'list'; elements: ExprNode[] }
  | { kind: 'listcomp'; expr: ExprNode; target: string; iter: ExprNode; cond?: ExprNode }
  | { kind: 'tuple'; elements: ExprNode[] }
  | { kind: 'dict'; pairs: { key: ExprNode; value: ExprNode }[] }
  | { kind: 'set'; elements: ExprNode[] }
  | { kind: 'call'; callee: ExprNode; args: { key?: string; expr: ExprNode }[] }
  | { kind: 'attr'; obj: ExprNode; name: string }
  | { kind: 'index'; obj: ExprNode; index: ExprNode }
  | { kind: 'slice'; obj: ExprNode; start?: ExprNode; end?: ExprNode; step?: ExprNode };

type StmtNode =
  | { kind: 'expr'; line: number; expr: ExprNode }
  | { kind: 'assign'; line: number; target: string; expr: ExprNode; op?: string }
  | { kind: 'multi_assign'; line: number; targets: string[]; expr: ExprNode }
  | { kind: 'attr_assign'; line: number; obj: ExprNode; attr: string; expr: ExprNode; op?: string }
  | { kind: 'index_assign'; line: number; obj: ExprNode; index: ExprNode; expr: ExprNode; op?: string }
  | { kind: 'if'; line: number; branches: { cond: ExprNode | null; body: StmtNode[] }[] }
  | { kind: 'for'; line: number; targets: string[]; iter: ExprNode; body: StmtNode[] }
  | { kind: 'while'; line: number; cond: ExprNode; body: StmtNode[] }
  | { kind: 'def'; line: number; name: string; params: { name: string; defaultExpr?: ExprNode }[]; body: StmtNode[] }
  | { kind: 'class'; line: number; name: string; parentName?: string; body: StmtNode[] }
  | { kind: 'return'; line: number; expr?: ExprNode }
  | { kind: 'break'; line: number }
  | { kind: 'continue'; line: number }
  | { kind: 'pass'; line: number }
  | { kind: 'import'; line: number; module: string; alias?: string; names?: string[] }
  | { kind: 'try'; line: number; tryBody: StmtNode[]; handlers: { errorType?: string; varName?: string; body: StmtNode[] }[]; finallyBody?: StmtNode[] }
  | { kind: 'raise'; line: number; errorType: string; messageExpr?: ExprNode };

// --- Expression Parser ---

class ExprParser {
  tokens: Token[];
  pos = 0;
  line?: number;

  constructor(tokens: Token[], line?: number) {
    this.tokens = tokens;
    this.line = line;
  }

  peek(offset = 0): Token {
    return this.tokens[this.pos + offset] ?? { type: 'EOF', value: '' };
  }

  next(): Token {
    return this.tokens[this.pos++] ?? { type: 'EOF', value: '' };
  }

  expect(type: TokenType, msg?: string): Token {
    const tok = this.peek();
    if (tok.type !== type) {
      throw new PyRuntimeError('SyntaxError', msg ?? `Sintaks tidak sesuai di dekat '${tok.value || 'akhir baris'}'`, this.line);
    }
    return this.next();
  }

  parseExpression(): ExprNode {
    const expr = this.parseLambdaOrTernary();
    // Implicit tuple at top level (e.g. return a, b)
    if (this.peek().type === 'COMMA') {
      const elements = [expr];
      while (this.peek().type === 'COMMA') {
        this.next();
        if (this.peek().type === 'EOF' || this.peek().type === 'RPAREN' || this.peek().type === 'RBRACKET') break;
        elements.push(this.parseLambdaOrTernary());
      }
      return { kind: 'tuple', elements };
    }
    return expr;
  }

  parseSingleExpr(): ExprNode {
    return this.parseLambdaOrTernary();
  }

  parseLambdaOrTernary(): ExprNode {
    if (this.peek().type === 'OP' && this.peek().value === 'lambda') {
      this.next();
      const params: string[] = [];
      if (this.peek().type !== 'COLON') {
        params.push(this.expect('IDENT', 'Parameter lambda harus berupa nama variabel').value);
        while (this.peek().type === 'COMMA') {
          this.next();
          params.push(this.expect('IDENT', 'Parameter lambda tidak valid').value);
        }
      }
      this.expect('COLON', 'Lambda harus memiliki tanda titik dua (:)');
      const body = this.parseLambdaOrTernary();
      return { kind: 'lambda', params, body };
    }

    const expr = this.parseOr();
    if (this.peek().type === 'OP' && this.peek().value === 'if') {
      this.next();
      const test = this.parseOr();
      if (this.peek().type !== 'OP' || this.peek().value !== 'else') {
        throw new PyRuntimeError('SyntaxError', 'Ekspresi kondisional memerlukan kata kunci else', this.line);
      }
      this.next();
      const orelse = this.parseLambdaOrTernary();
      return { kind: 'ternary', test, body: expr, orelse };
    }
    return expr;
  }

  parseOr(): ExprNode {
    let left = this.parseAnd();
    while (this.peek().type === 'OP' && this.peek().value === 'or') {
      this.next();
      left = { kind: 'binary', op: 'or', left, right: this.parseAnd() };
    }
    return left;
  }

  parseAnd(): ExprNode {
    let left = this.parseNot();
    while (this.peek().type === 'OP' && this.peek().value === 'and') {
      this.next();
      left = { kind: 'binary', op: 'and', left, right: this.parseNot() };
    }
    return left;
  }

  parseNot(): ExprNode {
    if (this.peek().type === 'OP' && this.peek().value === 'not') {
      this.next();
      return { kind: 'unary', op: 'not', expr: this.parseNot() };
    }
    return this.parseComparison();
  }

  parseComparison(): ExprNode {
    const left = this.parseBitOr();
    const ops: string[] = [];
    const comparators: ExprNode[] = [];

    while (true) {
      const tok = this.peek();
      if (tok.type === 'OP' && ['==', '!=', '<', '<=', '>', '>=', 'in', 'is'].includes(tok.value)) {
        this.next();
        if (tok.value === 'is' && this.peek().type === 'OP' && this.peek().value === 'not') {
          this.next();
          ops.push('is not');
        } else {
          ops.push(tok.value);
        }
        comparators.push(this.parseBitOr());
      } else if (tok.type === 'OP' && tok.value === 'not' && this.peek(1).type === 'OP' && this.peek(1).value === 'in') {
        this.next();
        this.next();
        ops.push('not in');
        comparators.push(this.parseBitOr());
      } else {
        break;
      }
    }

    if (ops.length === 0) return left;
    return { kind: 'compare', left, ops, comparators };
  }

  parseBitOr(): ExprNode {
    let left = this.parseBitAnd();
    while (this.peek().type === 'OP' && this.peek().value === '|') {
      this.next();
      left = { kind: 'binary', op: '|', left, right: this.parseBitAnd() };
    }
    return left;
  }

  parseBitAnd(): ExprNode {
    let left = this.parseAddSub();
    while (this.peek().type === 'OP' && this.peek().value === '&') {
      this.next();
      left = { kind: 'binary', op: '&', left, right: this.parseAddSub() };
    }
    return left;
  }

  parseAddSub(): ExprNode {
    let left = this.parseMulDiv();
    while (this.peek().type === 'OP' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.next().value;
      left = { kind: 'binary', op, left, right: this.parseMulDiv() };
    }
    return left;
  }

  parseMulDiv(): ExprNode {
    let left = this.parseUnary();
    while (this.peek().type === 'OP' && ['*', '/', '//', '%'].includes(this.peek().value)) {
      const op = this.next().value;
      left = { kind: 'binary', op, left, right: this.parseUnary() };
    }
    return left;
  }

  parseUnary(): ExprNode {
    if (this.peek().type === 'OP' && (this.peek().value === '-' || this.peek().value === '+')) {
      const op = this.next().value;
      return { kind: 'unary', op, expr: this.parseUnary() };
    }
    return this.parsePower();
  }

  parsePower(): ExprNode {
    const left = this.parsePostfix();
    if (this.peek().type === 'OP' && this.peek().value === '**') {
      this.next();
      return { kind: 'binary', op: '**', left, right: this.parseUnary() };
    }
    return left;
  }

  parsePostfix(): ExprNode {
    let node = this.parsePrimary();
    while (true) {
      if (this.peek().type === 'DOT') {
        this.next();
        const name = this.expect('IDENT', 'Nama atribut/method diharapkan setelah titik').value;
        node = { kind: 'attr', obj: node, name };
      } else if (this.peek().type === 'LPAREN') {
        this.next();
        const args: { key?: string; expr: ExprNode }[] = [];
        while (this.peek().type !== 'RPAREN' && this.peek().type !== 'EOF') {
          if (this.peek().type === 'IDENT' && this.peek(1).type === 'OP' && this.peek(1).value === '=') {
            const key = this.next().value;
            this.next(); // '='
            args.push({ key, expr: this.parseSingleExpr() });
          } else {
            args.push({ expr: this.parseSingleExpr() });
          }
          if (this.peek().type === 'COMMA') this.next();
        }
        this.expect('RPAREN', 'Kurung tutup ) diharapkan pada pemanggilan fungsi');
        node = { kind: 'call', callee: node, args };
      } else if (this.peek().type === 'LBRACKET') {
        this.next();
        let start: ExprNode | undefined;
        let isSlice = false;
        let end: ExprNode | undefined;
        let step: ExprNode | undefined;

        if (this.peek().type !== 'COLON') {
          start = this.parseSingleExpr();
        }
        if (this.peek().type === 'COLON') {
          isSlice = true;
          this.next();
          if (this.peek().type !== 'COLON' && this.peek().type !== 'RBRACKET') {
            end = this.parseSingleExpr();
          }
          if (this.peek().type === 'COLON') {
            this.next();
            if (this.peek().type !== 'RBRACKET') {
              step = this.parseSingleExpr();
            }
          }
        }
        this.expect('RBRACKET', 'Kurung siku tutup ] diharapkan');
        if (isSlice) {
          node = { kind: 'slice', obj: node, start, end, step };
        } else {
          if (!start) throw new PyRuntimeError('SyntaxError', 'Indeks tidak boleh kosong', this.line);
          node = { kind: 'index', obj: node, index: start };
        }
      } else {
        break;
      }
    }
    return node;
  }

  parsePrimary(): ExprNode {
    const tok = this.peek();

    if (tok.type === 'NUMBER') {
      this.next();
      return { kind: 'literal', value: Number(tok.value) };
    }
    if (tok.type === 'STRING') {
      this.next();
      return { kind: 'literal', value: tok.value };
    }
    if (tok.type === 'FSTRING') {
      this.next();
      return { kind: 'fstring', raw: tok.value };
    }
    if (tok.type === 'OP' && tok.value === 'True') {
      this.next();
      return { kind: 'literal', value: true };
    }
    if (tok.type === 'OP' && tok.value === 'False') {
      this.next();
      return { kind: 'literal', value: false };
    }
    if (tok.type === 'OP' && tok.value === 'None') {
      this.next();
      return { kind: 'literal', value: null };
    }
    if (tok.type === 'IDENT') {
      this.next();
      return { kind: 'var', name: tok.value };
    }

    // Parenthesized expr or tuple
    if (tok.type === 'LPAREN') {
      this.next();
      if (this.peek().type === 'RPAREN') {
        this.next();
        return { kind: 'tuple', elements: [] };
      }
      const first = this.parseSingleExpr();
      if (this.peek().type === 'COMMA') {
        const elements = [first];
        while (this.peek().type === 'COMMA') {
          this.next();
          if (this.peek().type === 'RPAREN') break;
          elements.push(this.parseSingleExpr());
        }
        this.expect('RPAREN', 'Kurung tutup ) diharapkan pada tuple');
        return { kind: 'tuple', elements };
      }
      this.expect('RPAREN', 'Kurung tutup ) diharapkan');
      return first;
    }

    // List or list comprehension
    if (tok.type === 'LBRACKET') {
      this.next();
      if (this.peek().type === 'RBRACKET') {
        this.next();
        return { kind: 'list', elements: [] };
      }
      const first = this.parseSingleExpr();
      if (this.peek().type === 'OP' && this.peek().value === 'for') {
        this.next();
        const target = this.expect('IDENT', 'Variabel iterasi list comprehension diharapkan').value;
        if (this.peek().type !== 'OP' || this.peek().value !== 'in') {
          throw new PyRuntimeError('SyntaxError', 'Kata kunci "in" diharapkan pada list comprehension', this.line);
        }
        this.next();
        const iter = this.parseOr();
        let cond: ExprNode | undefined;
        if (this.peek().type === 'OP' && this.peek().value === 'if') {
          this.next();
          cond = this.parseOr();
        }
        this.expect('RBRACKET', 'Kurung siku tutup ] diharapkan pada list comprehension');
        return { kind: 'listcomp', expr: first, target, iter, cond };
      }

      const elements = [first];
      while (this.peek().type === 'COMMA') {
        this.next();
        if (this.peek().type === 'RBRACKET') break;
        elements.push(this.parseSingleExpr());
      }
      this.expect('RBRACKET', 'Kurung siku tutup ] diharapkan pada list');
      return { kind: 'list', elements };
    }

    // Dict or Set
    if (tok.type === 'LBRACE') {
      this.next();
      if (this.peek().type === 'RBRACE') {
        this.next();
        return { kind: 'dict', pairs: [] };
      }
      const first = this.parseSingleExpr();
      if (this.peek().type === 'COLON') {
        this.next();
        const firstVal = this.parseSingleExpr();
        const pairs = [{ key: first, value: firstVal }];
        while (this.peek().type === 'COMMA') {
          this.next();
          if (this.peek().type === 'RBRACE') break;
          const k = this.parseSingleExpr();
          this.expect('COLON', 'Tanda titik dua : diharapkan pada dictionary');
          const v = this.parseSingleExpr();
          pairs.push({ key: k, value: v });
        }
        this.expect('RBRACE', 'Kurung kurawal tutup } diharapkan pada dictionary');
        return { kind: 'dict', pairs };
      }
      const elements = [first];
      while (this.peek().type === 'COMMA') {
        this.next();
        if (this.peek().type === 'RBRACE') break;
        elements.push(this.parseSingleExpr());
      }
      this.expect('RBRACE', 'Kurung kurawal tutup } diharapkan pada set');
      return { kind: 'set', elements };
    }

    throw new PyRuntimeError('SyntaxError', `Ekspresi tidak valid di dekat '${tok.value || 'akhir baris'}'`, this.line);
  }
}

function parseExprStr(src: string, line?: number): ExprNode {
  const tokens = tokenizeExpr(src.trim(), line);
  const parser = new ExprParser(tokens, line);
  const expr = parser.parseExpression();
  if (parser.peek().type !== 'EOF') {
    throw new PyRuntimeError('SyntaxError', `Token tidak terduga '${parser.peek().value}'`, line);
  }
  return expr;
}

// --- Indentation-Aware Line/Block Parser ---

interface SourceLine {
  lineNum: number;
  indent: number;
  text: string;
}

function stripInlineComment(raw: string): string {
  let inQuote: string | null = null;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inQuote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === inQuote) inQuote = null;
    } else {
      if (ch === '"' || ch === "'") inQuote = ch;
      else if (ch === '#') return raw.slice(0, i);
    }
  }
  return raw;
}

function preprocessLines(code: string): SourceLine[] {
  const rawLines = code.replace(/\r\n/g, '\n').split('\n');
  const lines: SourceLine[] = [];
  for (let idx = 0; idx < rawLines.length; idx++) {
    const expanded = rawLines[idx].replace(/\t/g, '    ');
    const stripped = stripInlineComment(expanded);
    if (stripped.trim().length === 0) continue;
    const indent = stripped.length - stripped.trimStart().length;
    lines.push({
      lineNum: idx + 1,
      indent,
      text: stripped.trim(),
    });
  }
  return lines;
}

function findTopLevelAssign(text: string): { lhs: string; op: string; rhs: string } | null {
  let depth = 0;
  let inQuote: string | null = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuote) {
      if (ch === '\\') {
        i++;
        continue;
      }
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      continue;
    }
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    else if (depth === 0) {
      const two = text.slice(i, i + 2);
      if (['+=', '-=', '*=', '/=', '%='].includes(two)) {
        return { lhs: text.slice(0, i).trim(), op: two, rhs: text.slice(i + 2).trim() };
      }
      if (ch === '=' && text[i - 1] !== '=' && text[i - 1] !== '!' && text[i - 1] !== '<' && text[i - 1] !== '>' && text[i + 1] !== '=') {
        return { lhs: text.slice(0, i).trim(), op: '=', rhs: text.slice(i + 1).trim() };
      }
    }
  }
  return null;
}

function parseBlock(lines: SourceLine[], startIdx: number, expectedIndent: number): { stmts: StmtNode[]; nextIdx: number } {
  const stmts: StmtNode[] = [];
  let i = startIdx;

  while (i < lines.length) {
    const cur = lines[i];
    if (cur.indent < expectedIndent) break;
    if (cur.indent > expectedIndent) {
      throw new PyRuntimeError('IndentationError', 'Indentasi tidak konsisten', cur.lineNum);
    }

    const { text, lineNum } = cur;

    if (text === 'pass') {
      stmts.push({ kind: 'pass', line: lineNum });
      i++;
      continue;
    }
    if (text === 'break') {
      stmts.push({ kind: 'break', line: lineNum });
      i++;
      continue;
    }
    if (text === 'continue') {
      stmts.push({ kind: 'continue', line: lineNum });
      i++;
      continue;
    }
    if (text === 'return' || text.startsWith('return ')) {
      const rest = text.slice(6).trim();
      stmts.push({ kind: 'return', line: lineNum, expr: rest ? parseExprStr(rest, lineNum) : undefined });
      i++;
      continue;
    }

    // import math / from math import sqrt, pi
    if (text.startsWith('import ')) {
      const rest = text.slice(7).trim();
      const parts = rest.split(/\s+as\s+/);
      stmts.push({ kind: 'import', line: lineNum, module: parts[0].trim(), alias: parts[1]?.trim() });
      i++;
      continue;
    }
    if (text.startsWith('from ')) {
      const m = text.match(/^from\s+([a-zA-Z_]\w*)\s+import\s+(.+)$/);
      if (!m) throw new PyRuntimeError('SyntaxError', 'Format from ... import tidak valid', lineNum);
      const names = m[2].split(',').map((s) => s.trim());
      stmts.push({ kind: 'import', line: lineNum, module: m[1], names });
      i++;
      continue;
    }

    // raise ValueError("msg")
    if (text.startsWith('raise ')) {
      const rest = text.slice(6).trim();
      const m = rest.match(/^([a-zA-Z_]\w*)(?:\((.*)\))?$/);
      if (!m) throw new PyRuntimeError('SyntaxError', 'Format raise tidak valid', lineNum);
      stmts.push({
        kind: 'raise',
        line: lineNum,
        errorType: m[1],
        messageExpr: m[2]?.trim() ? parseExprStr(m[2].trim(), lineNum) : undefined,
      });
      i++;
      continue;
    }

    // if / elif / else
    if (text.startsWith('if ') && text.endsWith(':')) {
      const branches: { cond: ExprNode | null; body: StmtNode[] }[] = [];
      const firstCond = parseExprStr(text.slice(3, -1), lineNum);
      i++;
      if (i >= lines.length || lines[i].indent <= expectedIndent) {
        throw new PyRuntimeError('IndentationError', 'Blok if memerlukan baris terindentasi', lineNum);
      }
      const firstBlock = parseBlock(lines, i, lines[i].indent);
      branches.push({ cond: firstCond, body: firstBlock.stmts });
      i = firstBlock.nextIdx;

      while (i < lines.length && lines[i].indent === expectedIndent) {
        if (lines[i].text.startsWith('elif ') && lines[i].text.endsWith(':')) {
          const elifCond = parseExprStr(lines[i].text.slice(5, -1), lines[i].lineNum);
          i++;
          if (i >= lines.length || lines[i].indent <= expectedIndent) {
            throw new PyRuntimeError('IndentationError', 'Blok elif memerlukan baris terindentasi', lines[i - 1].lineNum);
          }
          const elifBlock = parseBlock(lines, i, lines[i].indent);
          branches.push({ cond: elifCond, body: elifBlock.stmts });
          i = elifBlock.nextIdx;
        } else if (lines[i].text === 'else:') {
          i++;
          if (i >= lines.length || lines[i].indent <= expectedIndent) {
            throw new PyRuntimeError('IndentationError', 'Blok else memerlukan baris terindentasi', lines[i - 1].lineNum);
          }
          const elseBlock = parseBlock(lines, i, lines[i].indent);
          branches.push({ cond: null, body: elseBlock.stmts });
          i = elseBlock.nextIdx;
          break;
        } else {
          break;
        }
      }
      stmts.push({ kind: 'if', line: lineNum, branches });
      continue;
    }

    // for x in iterable:
    if (text.startsWith('for ') && text.endsWith(':')) {
      const m = text.match(/^for\s+(.+?)\s+in\s+(.+):$/);
      if (!m) throw new PyRuntimeError('SyntaxError', 'Sintaks perulangan for tidak valid', lineNum);
      const targets = m[1].split(',').map((s) => s.trim());
      const iter = parseExprStr(m[2], lineNum);
      i++;
      if (i >= lines.length || lines[i].indent <= expectedIndent) {
        throw new PyRuntimeError('IndentationError', 'Blok for memerlukan baris terindentasi', lineNum);
      }
      const bodyBlock = parseBlock(lines, i, lines[i].indent);
      stmts.push({ kind: 'for', line: lineNum, targets, iter, body: bodyBlock.stmts });
      i = bodyBlock.nextIdx;
      continue;
    }

    // while cond:
    if (text.startsWith('while ') && text.endsWith(':')) {
      const cond = parseExprStr(text.slice(6, -1), lineNum);
      i++;
      if (i >= lines.length || lines[i].indent <= expectedIndent) {
        throw new PyRuntimeError('IndentationError', 'Blok while memerlukan baris terindentasi', lineNum);
      }
      const bodyBlock = parseBlock(lines, i, lines[i].indent);
      stmts.push({ kind: 'while', line: lineNum, cond, body: bodyBlock.stmts });
      i = bodyBlock.nextIdx;
      continue;
    }

    // def name(params):
    if (text.startsWith('def ') && text.endsWith(':')) {
      const m = text.match(/^def\s+([a-zA-Z_]\w*)\s*\((.*)\):$/);
      if (!m) throw new PyRuntimeError('SyntaxError', 'Sintaks definisi fungsi def tidak valid', lineNum);
      const name = m[1];
      const rawParams = m[2].trim();
      const params: { name: string; defaultExpr?: ExprNode }[] = [];
      if (rawParams) {
        // Split top-level commas
        const parts: string[] = [];
        let curPart = '';
        let d = 0;
        for (const ch of rawParams) {
          if ('([{'.includes(ch)) d++;
          else if (')]}'.includes(ch)) d--;
          if (ch === ',' && d === 0) {
            parts.push(curPart.trim());
            curPart = '';
          } else {
            curPart += ch;
          }
        }
        if (curPart.trim()) parts.push(curPart.trim());
        for (const p of parts) {
          const eqIdx = p.indexOf('=');
          if (eqIdx !== -1) {
            params.push({
              name: p.slice(0, eqIdx).trim(),
              defaultExpr: parseExprStr(p.slice(eqIdx + 1).trim(), lineNum),
            });
          } else {
            params.push({ name: p });
          }
        }
      }
      i++;
      if (i >= lines.length || lines[i].indent <= expectedIndent) {
        throw new PyRuntimeError('IndentationError', 'Blok def memerlukan baris terindentasi', lineNum);
      }
      const bodyBlock = parseBlock(lines, i, lines[i].indent);
      stmts.push({ kind: 'def', line: lineNum, name, params, body: bodyBlock.stmts });
      i = bodyBlock.nextIdx;
      continue;
    }

    // class Name(Parent):
    if (text.startsWith('class ') && text.endsWith(':')) {
      const m = text.match(/^class\s+([a-zA-Z_]\w*)(?:\s*\(\s*([a-zA-Z_]\w*)?\s*\))?:$/);
      if (!m) throw new PyRuntimeError('SyntaxError', 'Sintaks definisi class tidak valid', lineNum);
      const name = m[1];
      const parentName = m[2] || undefined;
      i++;
      if (i >= lines.length || lines[i].indent <= expectedIndent) {
        throw new PyRuntimeError('IndentationError', 'Blok class memerlukan baris terindentasi', lineNum);
      }
      const bodyBlock = parseBlock(lines, i, lines[i].indent);
      stmts.push({ kind: 'class', line: lineNum, name, parentName, body: bodyBlock.stmts });
      i = bodyBlock.nextIdx;
      continue;
    }

    // try / except / finally
    if (text === 'try:') {
      i++;
      if (i >= lines.length || lines[i].indent <= expectedIndent) {
        throw new PyRuntimeError('IndentationError', 'Blok try memerlukan baris terindentasi', lineNum);
      }
      const tryBlock = parseBlock(lines, i, lines[i].indent);
      i = tryBlock.nextIdx;
      const handlers: { errorType?: string; varName?: string; body: StmtNode[] }[] = [];
      let finallyBody: StmtNode[] | undefined;

      while (i < lines.length && lines[i].indent === expectedIndent) {
        const curText = lines[i].text;
        if (curText.startsWith('except') && curText.endsWith(':')) {
          const header = curText.slice(6, -1).trim();
          let errorType: string | undefined;
          let varName: string | undefined;
          if (header) {
            const asMatch = header.match(/^([a-zA-Z_]\w*)(?:\s+as\s+([a-zA-Z_]\w*))?$/);
            if (asMatch) {
              errorType = asMatch[1];
              varName = asMatch[2];
            }
          }
          i++;
          if (i >= lines.length || lines[i].indent <= expectedIndent) {
            throw new PyRuntimeError('IndentationError', 'Blok except memerlukan baris terindentasi', lines[i - 1].lineNum);
          }
          const hBlock = parseBlock(lines, i, lines[i].indent);
          handlers.push({ errorType, varName, body: hBlock.stmts });
          i = hBlock.nextIdx;
        } else if (curText === 'finally:') {
          i++;
          if (i >= lines.length || lines[i].indent <= expectedIndent) {
            throw new PyRuntimeError('IndentationError', 'Blok finally memerlukan baris terindentasi', lines[i - 1].lineNum);
          }
          const fBlock = parseBlock(lines, i, lines[i].indent);
          finallyBody = fBlock.stmts;
          i = fBlock.nextIdx;
          break;
        } else {
          break;
        }
      }
      stmts.push({ kind: 'try', line: lineNum, tryBody: tryBlock.stmts, handlers, finallyBody });
      continue;
    }

    // Assignment or Expression
    const assign = findTopLevelAssign(text);
    if (assign) {
      const rhsExpr = parseExprStr(assign.rhs, lineNum);
      const lhs = assign.lhs;
      const op = assign.op === '=' ? undefined : assign.op;

      if (lhs.includes(',') && !lhs.includes('[') && !lhs.includes('(')) {
        const targets = lhs.split(',').map((s) => s.trim());
        stmts.push({ kind: 'multi_assign', line: lineNum, targets, expr: rhsExpr });
      } else if (/^[a-zA-Z_]\w*$/.test(lhs)) {
        stmts.push({ kind: 'assign', line: lineNum, target: lhs, expr: rhsExpr, op });
      } else {
        const lhsNode = parseExprStr(lhs, lineNum);
        if (lhsNode.kind === 'attr') {
          stmts.push({ kind: 'attr_assign', line: lineNum, obj: lhsNode.obj, attr: lhsNode.name, expr: rhsExpr, op });
        } else if (lhsNode.kind === 'index') {
          stmts.push({ kind: 'index_assign', line: lineNum, obj: lhsNode.obj, index: lhsNode.index, expr: rhsExpr, op });
        } else {
          throw new PyRuntimeError('SyntaxError', `Target penugasan '${lhs}' tidak valid`, lineNum);
        }
      }
      i++;
      continue;
    }

    stmts.push({ kind: 'expr', line: lineNum, expr: parseExprStr(text, lineNum) });
    i++;
  }

  return { stmts, nextIdx: i };
}

// --- Evaluator ---

export function runPythonCode(code: string, mockInputs: string[] = []): PythonExecutionResult {
  const startedAt = Date.now();
  const output: string[] = [];
  let inputCursor = 0;
  let stepCount = 0;
  const MAX_STEPS = 8000;

  function tick(line?: number) {
    stepCount++;
    if (stepCount > MAX_STEPS) {
      throw new PyRuntimeError(
        'RecursionError',
        'Batas langkah eksekusi terlampaui (kemungkinan infinite loop atau rekursi tanpa base case)',
        line
      );
    }
  }

  const globalEnv = new Env(null);

  const mathExports = new Map<string, PyValue>([
    ['pi', Math.PI],
    ['e', Math.E],
    ['sqrt', { __pyType: 'builtin', name: 'sqrt', fn: ([x]) => Math.sqrt(Number(x)) }],
    ['floor', { __pyType: 'builtin', name: 'floor', fn: ([x]) => Math.floor(Number(x)) }],
    ['ceil', { __pyType: 'builtin', name: 'ceil', fn: ([x]) => Math.ceil(Number(x)) }],
    ['pow', { __pyType: 'builtin', name: 'pow', fn: ([x, y]) => Math.pow(Number(x), Number(y)) }],
    [
      'factorial',
      {
        __pyType: 'builtin',
        name: 'factorial',
        fn: ([x]) => {
          const n = Number(x);
          if (!Number.isInteger(n) || n < 0) {
            throw new PyRuntimeError('ValueError', 'factorial() hanya menerima bilangan bulat non-negatif');
          }
          let res = 1;
          for (let k = 2; k <= n; k++) res *= k;
          return res;
        },
      },
    ],
  ]);

  const builtinModules: Record<string, PyModule> = {
    math: { __pyType: 'module', name: 'math', exports: mathExports },
  };

  function registerBuiltin(name: string, fn: (args: PyValue[], kwargs: Record<string, PyValue>) => PyValue) {
    globalEnv.set(name, { __pyType: 'builtin', name, fn });
  }

  registerBuiltin('print', (args, kwargs) => {
    const sep = typeof kwargs.sep === 'string' ? kwargs.sep : ' ';
    const lineText = args.map(formatPyStr).join(sep);
    output.push(lineText);
    return null;
  });

  registerBuiltin('input', (args) => {
    const prompt = args[0] !== undefined ? formatPyStr(args[0]) : '';
    const val = mockInputs[inputCursor] ?? '';
    inputCursor++;
    if (prompt) {
      output.push(`${prompt}${val}`);
    }
    return val;
  });

  registerBuiltin('len', ([x]) => {
    if (typeof x === 'string' || Array.isArray(x)) return x.length;
    if (isObj(x)) {
      if (x.__pyType === 'tuple' || x.__pyType === 'set') return x.items.length;
      if (x.__pyType === 'dict') return x.entries.size;
    }
    throw new PyRuntimeError('TypeError', `len() tidak mendukung tipe '${getPyTypeName(x)}'`);
  });

  registerBuiltin('range', (args) => {
    let start = 0;
    let stop = 0;
    let step = 1;
    if (args.length === 1) {
      stop = Number(args[0]);
    } else if (args.length === 2) {
      start = Number(args[0]);
      stop = Number(args[1]);
    } else if (args.length === 3) {
      start = Number(args[0]);
      stop = Number(args[1]);
      step = Number(args[2]);
    }
    if (step === 0) throw new PyRuntimeError('ValueError', 'Argumen step pada range() tidak boleh 0');
    const res: number[] = [];
    if (step > 0) {
      for (let v = start; v < stop; v += step) {
        if (res.length > 2000) break;
        res.push(v);
      }
    } else {
      for (let v = start; v > stop; v += step) {
        if (res.length > 2000) break;
        res.push(v);
      }
    }
    return res;
  });

  registerBuiltin('int', ([x]) => {
    if (typeof x === 'boolean') return x ? 1 : 0;
    if (typeof x === 'number') return Math.trunc(x);
    if (typeof x === 'string') {
      const trimmed = x.trim();
      if (!/^[+-]?\d+$/.test(trimmed)) {
        throw new PyRuntimeError('ValueError', `Tidak dapat mengubah '${x}' menjadi int`);
      }
      return parseInt(trimmed, 10);
    }
    throw new PyRuntimeError('TypeError', `Tidak dapat mengonversi tipe '${getPyTypeName(x)}' ke int`);
  });

  registerBuiltin('float', ([x]) => {
    if (typeof x === 'boolean') return x ? 1 : 0;
    const n = Number(x);
    if (Number.isNaN(n)) throw new PyRuntimeError('ValueError', `Tidak dapat mengubah '${x}' menjadi float`);
    return n;
  });

  registerBuiltin('str', ([x]) => (x === undefined ? '' : formatPyStr(x)));
  registerBuiltin('bool', ([x]) => (x === undefined ? false : isTruthy(x)));
  registerBuiltin('type', ([x]) => `<class '${getPyTypeName(x)}'>`);
  registerBuiltin('abs', ([x]) => Math.abs(Number(x)));
  registerBuiltin('round', ([x, d]) => {
    const n = Number(x);
    if (d === undefined) return Math.round(n);
    const factor = Math.pow(10, Number(d));
    return Math.round(n * factor) / factor;
  });
  registerBuiltin('pow', ([x, y]) => Math.pow(Number(x), Number(y)));
  registerBuiltin('sum', ([iter]) => {
    const items = toIterable(iter);
    return items.reduce<number>((acc, v) => acc + Number(v), 0);
  });
  registerBuiltin('min', (args) => {
    const items = args.length === 1 ? toIterable(args[0]) : args;
    if (items.length === 0) throw new PyRuntimeError('ValueError', 'min() menerima koleksi kosong');
    return items.reduce((a, b) => (Number(a) <= Number(b) ? a : b));
  });
  registerBuiltin('max', (args) => {
    const items = args.length === 1 ? toIterable(args[0]) : args;
    if (items.length === 0) throw new PyRuntimeError('ValueError', 'max() menerima koleksi kosong');
    return items.reduce((a, b) => (Number(a) >= Number(b) ? a : b));
  });
  registerBuiltin('list', ([x]) => (x === undefined ? [] : toIterable(x)));
  registerBuiltin('tuple', ([x]) => ({ __pyType: 'tuple', items: x === undefined ? [] : toIterable(x) }));
  registerBuiltin('set', ([x]) => makeSet(x === undefined ? [] : toIterable(x)));
  registerBuiltin('dict', () => ({ __pyType: 'dict', entries: new Map() }));
  registerBuiltin('sorted', ([iter], kwargs) => {
    const arr = [...toIterable(iter)];
    const reverse = Boolean(kwargs.reverse);
    arr.sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return formatPyStr(a).localeCompare(formatPyStr(b));
    });
    if (reverse) arr.reverse();
    return arr;
  });
  registerBuiltin('reversed', ([iter]) => [...toIterable(iter)].reverse());
  registerBuiltin('enumerate', ([iter, start = 0]) => {
    const items = toIterable(iter);
    const s = Number(start);
    return items.map((item, idx) => ({ __pyType: 'tuple' as const, items: [s + idx, item] }));
  });
  registerBuiltin('zip', (args) => {
    const lists = args.map((a) => toIterable(a));
    const minLen = lists.length ? Math.min(...lists.map((l) => l.length)) : 0;
    const result: PyTuple[] = [];
    for (let idx = 0; idx < minLen; idx++) {
      result.push({ __pyType: 'tuple', items: lists.map((l) => l[idx]) });
    }
    return result;
  });
  registerBuiltin('map', ([fnVal, iter]) => {
    const items = toIterable(iter);
    return items.map((item) => invokeCallable(fnVal, [item], {}, undefined));
  });
  registerBuiltin('filter', ([fnVal, iter]) => {
    const items = toIterable(iter);
    return items.filter((item) => isTruthy(invokeCallable(fnVal, [item], {}, undefined)));
  });
  registerBuiltin('isinstance', ([obj, cls]) => {
    if (isObj(obj) && obj.__pyType === 'instance' && isObj(cls) && cls.__pyType === 'class') {
      let cur: PyClass | null = obj.cls;
      while (cur) {
        if (cur === cls) return true;
        cur = cur.parent;
      }
      return false;
    }
    return false;
  });
  registerBuiltin('super', () => {
    throw new PyRuntimeError('RuntimeError', 'super() hanya dapat dipanggil di dalam method class turunan');
  });

  function lookupMethod(cls: PyClass | null, name: string): { fn: PyFunction; owner: PyClass } | null {
    let cur = cls;
    while (cur) {
      if (cur.methods.has(name)) return { fn: cur.methods.get(name)!, owner: cur };
      cur = cur.parent;
    }
    return null;
  }

  function invokeCallable(
    callee: PyValue,
    args: PyValue[],
    kwargs: Record<string, PyValue>,
    line?: number,
    activeMethodOwner?: { cls: PyClass; instance: PyInstance }
  ): PyValue {
    tick(line);
    if (isObj(callee)) {
      if (callee.__pyType === 'builtin') {
        if (callee.name === 'super' && activeMethodOwner?.cls.parent) {
          return {
            __pyType: 'super',
            instance: activeMethodOwner.instance,
            parentClass: activeMethodOwner.cls.parent,
          };
        }
        return callee.fn(args, kwargs);
      }
      if (callee.__pyType === 'function') {
        const fnEnv = new Env(callee.closure);
        for (let idx = 0; idx < callee.params.length; idx++) {
          const param = callee.params[idx];
          if (idx < args.length) {
            fnEnv.set(param.name, args[idx]);
          } else if (param.name in kwargs) {
            fnEnv.set(param.name, kwargs[param.name]);
          } else if (param.defaultExpr) {
            fnEnv.set(param.name, evalExpr(param.defaultExpr, callee.closure, line));
          } else {
            throw new PyRuntimeError('TypeError', `Fungsi '${callee.name}' kekurangan argumen '${param.name}'`, line);
          }
        }
        if (callee.isLambda && callee.lambdaExpr) {
          return evalExpr(callee.lambdaExpr, fnEnv, line);
        }
        try {
          execStmts(callee.body, fnEnv, activeMethodOwner);
        } catch (sig) {
          if (sig instanceof ReturnSignal) return sig.value;
          throw sig;
        }
        return null;
      }
      if (callee.__pyType === 'bound_method') {
        return invokeCallable(callee.fn, [callee.instance, ...args], kwargs, line, {
          cls: callee.cls,
          instance: callee.instance,
        });
      }
      if (callee.__pyType === 'class') {
        const instance: PyInstance = { __pyType: 'instance', cls: callee, attrs: new Map() };
        const init = lookupMethod(callee, '__init__');
        if (init) {
          invokeCallable(init.fn, [instance, ...args], kwargs, line, { cls: init.owner, instance });
        }
        return instance;
      }
    }
    throw new PyRuntimeError('TypeError', `Objek bertipe '${getPyTypeName(callee)}' tidak dapat dipanggil`, line);
  }

  function applyOp(op: string, left: PyValue, right: PyValue, line?: number): PyValue {
    if (op === '+') {
      if (typeof left === 'number' && typeof right === 'number') return left + right;
      if (typeof left === 'string' && typeof right === 'string') return left + right;
      if (Array.isArray(left) && Array.isArray(right)) return [...left, ...right];
      throw new PyRuntimeError('TypeError', `Operator '+' tidak mendukung '${getPyTypeName(left)}' dan '${getPyTypeName(right)}'`, line);
    }
    if (op === '-') {
      if (isObj(left) && left.__pyType === 'set' && isObj(right) && right.__pyType === 'set') {
        return makeSet(left.items.filter((x) => !right.items.some((y) => pyEquals(x, y))));
      }
      return Number(left) - Number(right);
    }
    if (op === '*') {
      if (typeof left === 'string' && typeof right === 'number') return left.repeat(Math.max(0, Math.floor(right)));
      if (typeof left === 'number' && typeof right === 'string') return right.repeat(Math.max(0, Math.floor(left)));
      return Number(left) * Number(right);
    }
    if (op === '/') {
      const denom = Number(right);
      if (denom === 0) throw new PyRuntimeError('ZeroDivisionError', 'Pembagian dengan nol tidak diperbolehkan', line);
      return Number(left) / denom;
    }
    if (op === '//') {
      const denom = Number(right);
      if (denom === 0) throw new PyRuntimeError('ZeroDivisionError', 'Pembagian bulat dengan nol tidak diperbolehkan', line);
      return Math.floor(Number(left) / denom);
    }
    if (op === '%') {
      const denom = Number(right);
      if (denom === 0) throw new PyRuntimeError('ZeroDivisionError', 'Modulo dengan nol tidak diperbolehkan', line);
      return ((Number(left) % denom) + denom) % denom;
    }
    if (op === '**') return Math.pow(Number(left), Number(right));
    if (op === '|') {
      if (isObj(left) && left.__pyType === 'set' && isObj(right) && right.__pyType === 'set') {
        return makeSet([...left.items, ...right.items]);
      }
    }
    if (op === '&') {
      if (isObj(left) && left.__pyType === 'set' && isObj(right) && right.__pyType === 'set') {
        return makeSet(left.items.filter((x) => right.items.some((y) => pyEquals(x, y))));
      }
    }
    throw new PyRuntimeError('TypeError', `Operator '${op}' tidak didukung`, line);
  }

  function evalCompareOp(op: string, a: PyValue, b: PyValue, line?: number): boolean {
    switch (op) {
      case '==': return pyEquals(a, b);
      case '!=': return !pyEquals(a, b);
      case '<': return typeof a === 'string' && typeof b === 'string' ? a < b : Number(a) < Number(b);
      case '<=': return typeof a === 'string' && typeof b === 'string' ? a <= b : Number(a) <= Number(b);
      case '>': return typeof a === 'string' && typeof b === 'string' ? a > b : Number(a) > Number(b);
      case '>=': return typeof a === 'string' && typeof b === 'string' ? a >= b : Number(a) >= Number(b);
      case 'is': return a === b;
      case 'is not': return a !== b;
      case 'in': {
        if (typeof b === 'string' && typeof a === 'string') return b.includes(a);
        if (Array.isArray(b)) return b.some((x) => pyEquals(x, a));
        if (isObj(b)) {
          if (b.__pyType === 'tuple' || b.__pyType === 'set') return b.items.some((x) => pyEquals(x, a));
          if (b.__pyType === 'dict') return b.entries.has(pyKeyHash(a));
        }
        throw new PyRuntimeError('TypeError', `Operator 'in' tidak mendukung tipe '${getPyTypeName(b)}'`, line);
      }
      case 'not in':
        return !evalCompareOp('in', a, b, line);
      default:
        return false;
    }
  }

  function getAttr(obj: PyValue, name: string, line?: number): PyValue {
    if (typeof obj === 'string') {
      const strMethods: Record<string, (args: PyValue[]) => PyValue> = {
        upper: () => obj.toUpperCase(),
        lower: () => obj.toLowerCase(),
        title: () => obj.replace(/\b\w/g, (c) => c.toUpperCase()),
        strip: () => obj.trim(),
        split: ([sep]) => (sep === undefined ? obj.trim().split(/\s+/).filter(Boolean) : obj.split(formatPyStr(sep))),
        replace: ([a, b]) => obj.split(formatPyStr(a)).join(formatPyStr(b)),
        join: ([iter]) => toIterable(iter, line).map(formatPyStr).join(obj),
        startswith: ([p]) => obj.startsWith(formatPyStr(p)),
        endswith: ([p]) => obj.endsWith(formatPyStr(p)),
      };
      if (strMethods[name]) return { __pyType: 'builtin', name, fn: (args) => strMethods[name](args) };
    }

    if (Array.isArray(obj)) {
      const listMethods: Record<string, (args: PyValue[]) => PyValue> = {
        append: ([v]) => { obj.push(v); return null; },
        pop: ([idx]) => {
          if (obj.length === 0) throw new PyRuntimeError('IndexError', 'pop dari list kosong', line);
          if (idx === undefined) return obj.pop()!;
          const i = Number(idx) < 0 ? obj.length + Number(idx) : Number(idx);
          return obj.splice(i, 1)[0];
        },
        insert: ([idx, v]) => { obj.splice(Number(idx), 0, v); return null; },
        remove: ([v]) => {
          const idx = obj.findIndex((item) => pyEquals(item, v));
          if (idx === -1) throw new PyRuntimeError('ValueError', `Nilai ${formatPyRepr(v)} tidak ada di list`, line);
          obj.splice(idx, 1);
          return null;
        },
        extend: ([iter]) => { obj.push(...toIterable(iter, line)); return null; },
        sort: () => {
          obj.sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : formatPyStr(a).localeCompare(formatPyStr(b))));
          return null;
        },
        reverse: () => { obj.reverse(); return null; },
        count: ([v]) => obj.filter((item) => pyEquals(item, v)).length,
        index: ([v]) => {
          const idx = obj.findIndex((item) => pyEquals(item, v));
          if (idx === -1) throw new PyRuntimeError('ValueError', `${formatPyRepr(v)} tidak ditemukan di list`, line);
          return idx;
        },
      };
      if (listMethods[name]) return { __pyType: 'builtin', name, fn: (args) => listMethods[name](args) };
    }

    if (isObj(obj)) {
      if (obj.__pyType === 'tuple') {
        if (name === 'count') return { __pyType: 'builtin', name, fn: ([v]) => obj.items.filter((x) => pyEquals(x, v)).length };
        if (name === 'index') return { __pyType: 'builtin', name, fn: ([v]) => obj.items.findIndex((x) => pyEquals(x, v)) };
      }
      if (obj.__pyType === 'dict') {
        const dictMethods: Record<string, (args: PyValue[]) => PyValue> = {
          keys: () => Array.from(obj.entries.values()).map((e) => e.key),
          values: () => Array.from(obj.entries.values()).map((e) => e.value),
          items: () => Array.from(obj.entries.values()).map((e) => ({ __pyType: 'tuple' as const, items: [e.key, e.value] })),
          get: ([k, def = null]) => obj.entries.get(pyKeyHash(k))?.value ?? def,
          pop: ([k, def]) => {
            const hash = pyKeyHash(k);
            if (obj.entries.has(hash)) {
              const val = obj.entries.get(hash)!.value;
              obj.entries.delete(hash);
              return val;
            }
            if (def !== undefined) return def;
            throw new PyRuntimeError('KeyError', `Key ${formatPyRepr(k)} tidak ditemukan`, line);
          },
          update: ([other]) => {
            if (isObj(other) && other.__pyType === 'dict') {
              for (const [k, v] of other.entries.entries()) obj.entries.set(k, v);
            }
            return null;
          },
        };
        if (dictMethods[name]) return { __pyType: 'builtin', name, fn: (args) => dictMethods[name](args) };
      }
      if (obj.__pyType === 'set') {
        const setMethods: Record<string, (args: PyValue[]) => PyValue> = {
          add: ([v]) => {
            if (!obj.items.some((x) => pyEquals(x, v))) obj.items.push(v);
            return null;
          },
          remove: ([v]) => {
            const idx = obj.items.findIndex((x) => pyEquals(x, v));
            if (idx === -1) throw new PyRuntimeError('KeyError', `Elemen ${formatPyRepr(v)} tidak ada di set`, line);
            obj.items.splice(idx, 1);
            return null;
          },
          union: ([other]) => makeSet([...obj.items, ...toIterable(other, line)]),
          intersection: ([other]) => {
            const otherItems = toIterable(other, line);
            return makeSet(obj.items.filter((x) => otherItems.some((y) => pyEquals(x, y))));
          },
          difference: ([other]) => {
            const otherItems = toIterable(other, line);
            return makeSet(obj.items.filter((x) => !otherItems.some((y) => pyEquals(x, y))));
          },
        };
        if (setMethods[name]) return { __pyType: 'builtin', name, fn: (args) => setMethods[name](args) };
      }
      if (obj.__pyType === 'module') {
        if (obj.exports.has(name)) return obj.exports.get(name)!;
      }
      if (obj.__pyType === 'instance') {
        if (obj.attrs.has(name)) return obj.attrs.get(name)!;
        const m = lookupMethod(obj.cls, name);
        if (m) return { __pyType: 'bound_method', instance: obj, fn: m.fn, cls: m.owner };
        let cur: PyClass | null = obj.cls;
        while (cur) {
          if (cur.classAttrs.has(name)) return cur.classAttrs.get(name)!;
          cur = cur.parent;
        }
      }
      if (obj.__pyType === 'super') {
        const m = lookupMethod(obj.parentClass, name);
        if (m) return { __pyType: 'bound_method', instance: obj.instance, fn: m.fn, cls: m.owner };
      }
      if (obj.__pyType === 'class') {
        if (obj.classAttrs.has(name)) return obj.classAttrs.get(name)!;
        const m = lookupMethod(obj, name);
        if (m) return m.fn;
      }
    }

    throw new PyRuntimeError('AttributeError', `Objek bertipe '${getPyTypeName(obj)}' tidak memiliki atribut '${name}'`, line);
  }

  function evalExpr(
    node: ExprNode,
    env: Env,
    line?: number,
    activeMethodOwner?: { cls: PyClass; instance: PyInstance }
  ): PyValue {
    tick(line);
    switch (node.kind) {
      case 'literal':
        return node.value;
      case 'fstring': {
        return node.raw.replace(/\{([^{}]+)\}/g, (_, inner: string) => {
          const colonIdx = inner.indexOf(':');
          let exprPart = inner;
          let formatSpec = '';
          if (colonIdx !== -1 && !inner.slice(0, colonIdx).includes("'") && !inner.slice(0, colonIdx).includes('"')) {
            exprPart = inner.slice(0, colonIdx);
            formatSpec = inner.slice(colonIdx + 1).trim();
          }
          const val = evalExpr(parseExprStr(exprPart, line), env, line, activeMethodOwner);
          if (formatSpec && typeof val === 'number') {
            const fixedMatch = formatSpec.match(/^\.(\d+)f$/);
            if (fixedMatch) return val.toFixed(Number(fixedMatch[1]));
          }
          return formatPyStr(val);
        });
      }
      case 'var':
        return env.get(node.name, line);
      case 'unary': {
        const v = evalExpr(node.expr, env, line, activeMethodOwner);
        if (node.op === 'not') return !isTruthy(v);
        if (node.op === '-') return -Number(v);
        return +Number(v);
      }
      case 'binary': {
        if (node.op === 'and') {
          const l = evalExpr(node.left, env, line, activeMethodOwner);
          return isTruthy(l) ? evalExpr(node.right, env, line, activeMethodOwner) : l;
        }
        if (node.op === 'or') {
          const l = evalExpr(node.left, env, line, activeMethodOwner);
          return isTruthy(l) ? l : evalExpr(node.right, env, line, activeMethodOwner);
        }
        const l = evalExpr(node.left, env, line, activeMethodOwner);
        const r = evalExpr(node.right, env, line, activeMethodOwner);
        return applyOp(node.op, l, r, line);
      }
      case 'compare': {
        let cur = evalExpr(node.left, env, line, activeMethodOwner);
        for (let idx = 0; idx < node.ops.length; idx++) {
          const nextVal = evalExpr(node.comparators[idx], env, line, activeMethodOwner);
          if (!evalCompareOp(node.ops[idx], cur, nextVal, line)) return false;
          cur = nextVal;
        }
        return true;
      }
      case 'ternary':
        return isTruthy(evalExpr(node.test, env, line, activeMethodOwner))
          ? evalExpr(node.body, env, line, activeMethodOwner)
          : evalExpr(node.orelse, env, line, activeMethodOwner);
      case 'lambda':
        return {
          __pyType: 'function',
          name: '<lambda>',
          params: node.params.map((name) => ({ name })),
          body: [],
          closure: env,
          isLambda: true,
          lambdaExpr: node.body,
        };
      case 'list':
        return node.elements.map((e) => evalExpr(e, env, line, activeMethodOwner));
      case 'listcomp': {
        const iterVal = toIterable(evalExpr(node.iter, env, line, activeMethodOwner), line);
        const out: PyValue[] = [];
        const compEnv = new Env(env);
        for (const item of iterVal) {
          compEnv.set(node.target, item);
          if (!node.cond || isTruthy(evalExpr(node.cond, compEnv, line, activeMethodOwner))) {
            out.push(evalExpr(node.expr, compEnv, line, activeMethodOwner));
          }
        }
        return out;
      }
      case 'tuple':
        return { __pyType: 'tuple', items: node.elements.map((e) => evalExpr(e, env, line, activeMethodOwner)) };
      case 'set':
        return makeSet(node.elements.map((e) => evalExpr(e, env, line, activeMethodOwner)));
      case 'dict': {
        const entries = new Map<string, { key: PyValue; value: PyValue }>();
        for (const p of node.pairs) {
          const k = evalExpr(p.key, env, line, activeMethodOwner);
          const v = evalExpr(p.value, env, line, activeMethodOwner);
          entries.set(pyKeyHash(k), { key: k, value: v });
        }
        return { __pyType: 'dict', entries };
      }
      case 'attr': {
        const obj = evalExpr(node.obj, env, line, activeMethodOwner);
        return getAttr(obj, node.name, line);
      }
      case 'call': {
        const callee = evalExpr(node.callee, env, line, activeMethodOwner);
        const posArgs: PyValue[] = [];
        const kwArgs: Record<string, PyValue> = {};
        for (const a of node.args) {
          const val = evalExpr(a.expr, env, line, activeMethodOwner);
          if (a.key) kwArgs[a.key] = val;
          else posArgs.push(val);
        }
        return invokeCallable(callee, posArgs, kwArgs, line, activeMethodOwner);
      }
      case 'index': {
        const obj = evalExpr(node.obj, env, line, activeMethodOwner);
        const idx = evalExpr(node.index, env, line, activeMethodOwner);
        if (isObj(obj) && obj.__pyType === 'dict') {
          const found = obj.entries.get(pyKeyHash(idx));
          if (!found) throw new PyRuntimeError('KeyError', `Key ${formatPyRepr(idx)} tidak ditemukan dalam dictionary`, line);
          return found.value;
        }
        const seq = Array.isArray(obj)
          ? obj
          : typeof obj === 'string'
            ? obj.split('')
            : isObj(obj) && obj.__pyType === 'tuple'
              ? obj.items
              : null;
        if (!seq) throw new PyRuntimeError('TypeError', `Tipe '${getPyTypeName(obj)}' tidak mendukung indexing`, line);
        const rawIdx = Number(idx);
        const resolved = rawIdx < 0 ? seq.length + rawIdx : rawIdx;
        if (resolved < 0 || resolved >= seq.length) {
          throw new PyRuntimeError('IndexError', `Indeks ${rawIdx} di luar jangkauan (panjang=${seq.length})`, line);
        }
        return seq[resolved];
      }
      case 'slice': {
        const obj = evalExpr(node.obj, env, line, activeMethodOwner);
        const rawSeq = Array.isArray(obj)
          ? obj
          : typeof obj === 'string'
            ? obj.split('')
            : isObj(obj) && obj.__pyType === 'tuple'
              ? obj.items
              : null;
        if (!rawSeq) throw new PyRuntimeError('TypeError', `Tipe '${getPyTypeName(obj)}' tidak mendukung slicing`, line);
        const len = rawSeq.length;
        const step = node.step ? Number(evalExpr(node.step, env, line, activeMethodOwner)) : 1;
        if (step === 0) throw new PyRuntimeError('ValueError', 'Step slicing tidak boleh nol', line);
        let start = node.start ? Number(evalExpr(node.start, env, line, activeMethodOwner)) : step > 0 ? 0 : len - 1;
        let end = node.end ? Number(evalExpr(node.end, env, line, activeMethodOwner)) : step > 0 ? len : -len - 1;
        if (start < 0) start = Math.max(step > 0 ? 0 : -1, len + start);
        if (end < 0) end = Math.max(-1, len + end);
        const sliced: PyValue[] = [];
        if (step > 0) {
          for (let k = start; k < Math.min(len, end); k += step) sliced.push(rawSeq[k]);
        } else {
          for (let k = Math.min(len - 1, start); k > end; k += step) sliced.push(rawSeq[k]);
        }
        if (typeof obj === 'string') return sliced.join('');
        if (isObj(obj) && obj.__pyType === 'tuple') return { __pyType: 'tuple', items: sliced };
        return sliced;
      }
    }
  }

  function execStmts(
    stmts: StmtNode[],
    env: Env,
    activeMethodOwner?: { cls: PyClass; instance: PyInstance }
  ) {
    for (const stmt of stmts) {
      tick(stmt.line);
      switch (stmt.kind) {
        case 'pass':
          break;
        case 'break':
          throw new BreakSignal();
        case 'continue':
          throw new ContinueSignal();
        case 'return':
          throw new ReturnSignal(stmt.expr ? evalExpr(stmt.expr, env, stmt.line, activeMethodOwner) : null);
        case 'expr':
          evalExpr(stmt.expr, env, stmt.line, activeMethodOwner);
          break;
        case 'assign': {
          let val = evalExpr(stmt.expr, env, stmt.line, activeMethodOwner);
          if (stmt.op) {
            const cur = env.get(stmt.target, stmt.line);
            val = applyOp(stmt.op[0], cur, val, stmt.line);
          }
          env.set(stmt.target, val);
          break;
        }
        case 'multi_assign': {
          const val = evalExpr(stmt.expr, env, stmt.line, activeMethodOwner);
          const items = toIterable(val, stmt.line);
          if (items.length !== stmt.targets.length) {
            throw new PyRuntimeError('ValueError', `Jumlah nilai unpacking (${items.length}) tidak cocok dengan variabel (${stmt.targets.length})`, stmt.line);
          }
          stmt.targets.forEach((t, idx) => env.set(t, items[idx]));
          break;
        }
        case 'attr_assign': {
          const obj = evalExpr(stmt.obj, env, stmt.line, activeMethodOwner);
          if (!isObj(obj) || obj.__pyType !== 'instance') {
            throw new PyRuntimeError('TypeError', 'Penugasan atribut hanya didukung pada objek instance', stmt.line);
          }
          let val = evalExpr(stmt.expr, env, stmt.line, activeMethodOwner);
          if (stmt.op) {
            const cur = obj.attrs.get(stmt.attr) ?? 0;
            val = applyOp(stmt.op[0], cur, val, stmt.line);
          }
          obj.attrs.set(stmt.attr, val);
          break;
        }
        case 'index_assign': {
          const obj = evalExpr(stmt.obj, env, stmt.line, activeMethodOwner);
          const idx = evalExpr(stmt.index, env, stmt.line, activeMethodOwner);
          let val = evalExpr(stmt.expr, env, stmt.line, activeMethodOwner);
          if (Array.isArray(obj)) {
            const i = Number(idx) < 0 ? obj.length + Number(idx) : Number(idx);
            if (i < 0 || i >= obj.length) throw new PyRuntimeError('IndexError', `Indeks ${idx} di luar batas list`, stmt.line);
            if (stmt.op) val = applyOp(stmt.op[0], obj[i], val, stmt.line);
            obj[i] = val;
          } else if (isObj(obj) && obj.__pyType === 'dict') {
            const h = pyKeyHash(idx);
            if (stmt.op) {
              const cur = obj.entries.get(h)?.value ?? 0;
              val = applyOp(stmt.op[0], cur, val, stmt.line);
            }
            obj.entries.set(h, { key: idx, value: val });
          } else if (isObj(obj) && obj.__pyType === 'tuple') {
            throw new PyRuntimeError('TypeError', "Objek 'tuple' bersifat immutable dan tidak dapat diubah elemennya", stmt.line);
          } else {
            throw new PyRuntimeError('TypeError', `Tipe '${getPyTypeName(obj)}' tidak mendukung perubahan elemen`, stmt.line);
          }
          break;
        }
        case 'if': {
          for (const branch of stmt.branches) {
            if (branch.cond === null || isTruthy(evalExpr(branch.cond, env, stmt.line, activeMethodOwner))) {
              execStmts(branch.body, env, activeMethodOwner);
              break;
            }
          }
          break;
        }
        case 'for': {
          const items = toIterable(evalExpr(stmt.iter, env, stmt.line, activeMethodOwner), stmt.line);
          for (const item of items) {
            if (stmt.targets.length === 1) {
              env.set(stmt.targets[0], item);
            } else {
              const unpacked = toIterable(item, stmt.line);
              stmt.targets.forEach((t, idx) => env.set(t, unpacked[idx] ?? null));
            }
            try {
              execStmts(stmt.body, env, activeMethodOwner);
            } catch (sig) {
              if (sig instanceof BreakSignal) break;
              if (sig instanceof ContinueSignal) continue;
              throw sig;
            }
          }
          break;
        }
        case 'while': {
          while (isTruthy(evalExpr(stmt.cond, env, stmt.line, activeMethodOwner))) {
            tick(stmt.line);
            try {
              execStmts(stmt.body, env, activeMethodOwner);
            } catch (sig) {
              if (sig instanceof BreakSignal) break;
              if (sig instanceof ContinueSignal) continue;
              throw sig;
            }
          }
          break;
        }
        case 'def': {
          const fnObj: PyFunction = {
            __pyType: 'function',
            name: stmt.name,
            params: stmt.params,
            body: stmt.body,
            closure: env,
          };
          env.set(stmt.name, fnObj);
          break;
        }
        case 'class': {
          let parent: PyClass | null = null;
          if (stmt.parentName) {
            const pVal = env.get(stmt.parentName, stmt.line);
            if (!isObj(pVal) || pVal.__pyType !== 'class') {
              throw new PyRuntimeError('TypeError', `'${stmt.parentName}' bukan merupakan class yang valid`, stmt.line);
            }
            parent = pVal;
          }
          const classEnv = new Env(env);
          execStmts(stmt.body, classEnv, activeMethodOwner);
          const methods = new Map<string, PyFunction>();
          const classAttrs = new Map<string, PyValue>();
          for (const [k, v] of classEnv.values.entries()) {
            if (isObj(v) && v.__pyType === 'function') methods.set(k, v);
            else classAttrs.set(k, v);
          }
          env.set(stmt.name, { __pyType: 'class', name: stmt.name, parent, methods, classAttrs });
          break;
        }
        case 'import': {
          const mod = builtinModules[stmt.module];
          if (!mod) throw new PyRuntimeError('ModuleNotFoundError', `Modul '${stmt.module}' tidak tersedia di sandbox`, stmt.line);
          if (stmt.names) {
            for (const n of stmt.names) {
              if (!mod.exports.has(n)) {
                throw new PyRuntimeError('ImportError', `Tidak dapat mengimpor '${n}' dari '${stmt.module}'`, stmt.line);
              }
              env.set(n, mod.exports.get(n)!);
            }
          } else {
            env.set(stmt.alias || stmt.module, mod);
          }
          break;
        }
        case 'try': {
          try {
            execStmts(stmt.tryBody, env, activeMethodOwner);
          } catch (err) {
            if (err instanceof PyRuntimeError) {
              let handled = false;
              for (const h of stmt.handlers) {
                if (!h.errorType || h.errorType === 'Exception' || h.errorType === err.pyType) {
                  if (h.varName) env.set(h.varName, err.message);
                  execStmts(h.body, env, activeMethodOwner);
                  handled = true;
                  break;
                }
              }
              if (!handled) throw err;
            } else {
              throw err;
            }
          } finally {
            if (stmt.finallyBody) {
              execStmts(stmt.finallyBody, env, activeMethodOwner);
            }
          }
          break;
        }
        case 'raise': {
          const msg = stmt.messageExpr ? formatPyStr(evalExpr(stmt.messageExpr, env, stmt.line, activeMethodOwner)) : stmt.errorType;
          throw new PyRuntimeError(stmt.errorType, msg, stmt.line);
        }
      }
    }
  }

  try {
    const lines = preprocessLines(code);
    const { stmts } = parseBlock(lines, 0, lines[0]?.indent ?? 0);
    execStmts(stmts, globalEnv);

    const variables: PythonVariableSnapshot[] = [];
    for (const [name, val] of globalEnv.values.entries()) {
      if (isObj(val) && val.__pyType === 'builtin') continue;
      variables.push({
        name,
        value: formatPyRepr(val),
        pyType: getPyTypeName(val),
      });
    }

    return {
      success: true,
      output,
      variables,
      executionMs: Math.max(1, Date.now() - startedAt),
    };
  } catch (err) {
    const variables: PythonVariableSnapshot[] = [];
    for (const [name, val] of globalEnv.values.entries()) {
      if (isObj(val) && val.__pyType === 'builtin') continue;
      variables.push({
        name,
        value: formatPyRepr(val),
        pyType: getPyTypeName(val),
      });
    }

    if (err instanceof PyRuntimeError) {
      return {
        success: false,
        output,
        variables,
        errorType: err.pyType,
        errorMessage: err.message,
        errorLine: err.line,
        executionMs: Math.max(1, Date.now() - startedAt),
      };
    }

    return {
      success: false,
      output,
      variables,
      errorType: 'RuntimeError',
      errorMessage: err instanceof Error ? err.message : 'Terjadi kesalahan saat eksekusi',
      executionMs: Math.max(1, Date.now() - startedAt),
    };
  }
}
