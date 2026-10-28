/* Tiruan pdfjs-dist untuk Jest.
   pdf.js v4 dikirim sebagai ESM (.mjs) dan memakai `import.meta`,
   yang tidak bisa di-parse oleh Babel/Jest — tanpa tiruan ini, satu
   saja `import "pdfjs-dist"` membuat seluruh uji gagal jalan
   (padahal di browser/webpack tidak masalah). Uji tidak butuh PDF asli,
   jadi cukup antarmuka yang dipakai src/data/paguPdf.js. */

module.exports = {
  version: "test",
  GlobalWorkerOptions: { workerSrc: "" },
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 0,
      getPage: () => Promise.resolve({ getTextContent: () => Promise.resolve({ items: [] }) }),
      destroy: () => Promise.resolve(),
    }),
    destroy: () => Promise.resolve(),
    onPassword: null,
    onProgress: null,
  }),
};
