export const malformedEmails = ['user@', 'user.example.com', '@example.com', 'user@@example.com', 'user name@example.com'];

export const injectionPayloads = {
  sql: "' OR 1=1--",
  xss: '<script>alert(1)</script>',
};

export const unregisteredEmail = 'no-such-user-kumparan-qa@example.com';
export const wrongPassword = 'WrongPass!123';

export const longText = (length: number) => 'a'.repeat(length);

export const search = {
  keyword: 'IHSG',
  noResults: 'zxqvbnmplk12345',
  single: 'a',
  long: longText(300),
};

export const comments = {
  normal: 'Tes komentar otomatis, tidak dikirim.',
  whitespace: '   ',
  multiline: 'Baris pertama\nBaris kedua\nBaris ketiga',
  emoji: 'Mantap 👍🔥🇮🇩',
  long: longText(2000),
};

export const reportReasonMaxLength = 80;
