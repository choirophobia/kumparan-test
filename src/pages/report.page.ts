import type { Locator, Page } from '@playwright/test';
import type { ArticleRef } from '../fixtures/article-picker';

export const REPORT_REASONS = [
  'Spam, Komersial, atau Iklan',
  'Memiliki unsur pornografi',
  'Membahayakan atau menjurus tindakan berbahaya',
  'Mengandung konten kekerasan',
  'Menyinggung SARA',
  'Lainnya',
] as const;

export const OTHER_REASON_INDEX = 5;

export class ReportPage {
  readonly articleCard: Locator;
  readonly reasons: Locator;
  readonly otherReasonInput: Locator;
  readonly submit: Locator;
  readonly cancel: Locator;
  readonly confirmDialog: Locator;
  readonly confirmCancel: Locator;

  constructor(private readonly page: Page) {
    this.articleCard = page.getByTestId('news-item');
    this.reasons = page.locator('[data-qa-id^="radio-btn-option-report-"]');
    this.otherReasonInput = page.getByTestId('input-report');
    this.submit = page.getByTestId('btn-report');
    this.cancel = page.getByTestId('btn-cancel');
    // pressing Laporkan opens "Konfirmasi" with Batal / Ya. "Ya" sends the
    // report, so tests only ever press Batal here. The dialog has no
    // data-qa-id, so it is found by its text.
    this.confirmDialog = page.locator('[class*="ModalContent"]').filter({ hasText: 'Apakah kamu yakin akan melaporkan konten ini?' });
    this.confirmCancel = this.confirmDialog.getByRole('button', { name: 'Batal' });
  }

  reason(index: number) {
    return this.page.getByTestId(`radio-btn-option-report-${index}`);
  }

  async goto(article: ArticleRef) {
    await this.page.goto(`/report/story/${article.slug}`);
    await this.reason(0).waitFor();
  }
}
