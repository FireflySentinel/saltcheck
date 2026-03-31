/**
 * Unicode confusable mappings: characters that visually resemble Latin letters.
 * Scoped to Cyrillic lookalikes and fullwidth ASCII characters.
 * Full Unicode TR39 coverage is out of scope for v1.
 */
export const UNICODE_CONFUSABLES: Record<string, string> = {
  // Cyrillic lookalikes → Latin
  '\u0410': 'a', // А
  '\u0430': 'a', // а
  '\u0412': 'b', // В (looks like B)
  '\u0432': 'b', // в
  '\u0421': 'c', // С
  '\u0441': 'c', // с
  '\u0415': 'e', // Е
  '\u0435': 'e', // е
  '\u041D': 'h', // Н (looks like H)
  '\u043D': 'h', // н
  '\u041A': 'k', // К
  '\u043A': 'k', // к
  '\u041C': 'm', // М
  '\u043C': 'm', // м
  '\u041E': 'o', // О
  '\u043E': 'o', // о
  '\u0420': 'p', // Р
  '\u0440': 'p', // р
  '\u0422': 't', // Т
  '\u0442': 't', // т
  '\u0425': 'x', // Х
  '\u0445': 'x', // х
  '\u0423': 'y', // У
  '\u0443': 'y', // у

  // Fullwidth ASCII → normal ASCII
  '\uFF21': 'a', '\uFF22': 'b', '\uFF23': 'c', '\uFF24': 'd',
  '\uFF25': 'e', '\uFF26': 'f', '\uFF27': 'g', '\uFF28': 'h',
  '\uFF29': 'i', '\uFF2A': 'j', '\uFF2B': 'k', '\uFF2C': 'l',
  '\uFF2D': 'm', '\uFF2E': 'n', '\uFF2F': 'o', '\uFF30': 'p',
  '\uFF31': 'q', '\uFF32': 'r', '\uFF33': 's', '\uFF34': 't',
  '\uFF35': 'u', '\uFF36': 'v', '\uFF37': 'w', '\uFF38': 'x',
  '\uFF39': 'y', '\uFF3A': 'z',
  '\uFF41': 'a', '\uFF42': 'b', '\uFF43': 'c', '\uFF44': 'd',
  '\uFF45': 'e', '\uFF46': 'f', '\uFF47': 'g', '\uFF48': 'h',
  '\uFF49': 'i', '\uFF4A': 'j', '\uFF4B': 'k', '\uFF4C': 'l',
  '\uFF4D': 'm', '\uFF4E': 'n', '\uFF4F': 'o', '\uFF50': 'p',
  '\uFF51': 'q', '\uFF52': 'r', '\uFF53': 's', '\uFF54': 't',
  '\uFF55': 'u', '\uFF56': 'v', '\uFF57': 'w', '\uFF58': 'x',
  '\uFF59': 'y', '\uFF5A': 'z',
}
