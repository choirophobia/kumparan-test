import { test, expect } from '../../../src/fixtures/test';
import { OTHER_REASON_INDEX, REPORT_REASONS } from '../../../src/pages/report.page';
import { reportReasonMaxLength } from '../../../src/data/test-data';

// The rules say reports must not be submitted. Pressing "Laporkan" only
// opens a "Konfirmasi" dialog, the real submit is "Ya" in that dialog, which
// is never pressed in this file.

test.describe('Report article', () => {
  test('RPT-001 Laporkan link opens the report page with 6 reasons', { tag: '@P1' }, async ({ page, article, articlePage, reportPage }) => {
    await articlePage.goto(article.path);
    await articlePage.scrollToFooter();
    await articlePage.reportLink.click();

    await expect(page).toHaveURL(new RegExp(`/report/story/${article.slug}`));
    await expect(reportPage.articleCard).toBeVisible();
    await expect(reportPage.reasons).toHaveText([...REPORT_REASONS]);
  });

  test.describe('report form', () => {
    test.beforeEach(async ({ article, reportPage }) => {
      await reportPage.goto(article);
    });

    test('RPT-002 Laporkan is disabled until a reason is picked', { tag: '@P1' }, async ({ reportPage }) => {
      await expect(reportPage.submit).toBeDisabled();
    });

    test('RPT-003 picking a reason enables Laporkan', { tag: '@P1' }, async ({ reportPage }) => {
      await reportPage.reason(0).click();
      await expect(reportPage.submit).toBeEnabled();
    });

    test('RPT-004 Lainnya needs a written reason', { tag: '@P2' }, async ({ reportPage }) => {
      await reportPage.reason(OTHER_REASON_INDEX).click();

      await expect(reportPage.otherReasonInput).toBeVisible();
      await expect(reportPage.otherReasonInput).toHaveAttribute('placeholder', 'Tulis alasan anda...');
      await expect(reportPage.submit).toBeDisabled();

      await reportPage.otherReasonInput.fill('Judul tidak sesuai isi');
      await expect(reportPage.submit).toBeEnabled();
    });

    test('RPT-005 written reason is limited to 80 characters', { tag: '@P2' }, async ({ page, reportPage }) => {
      await reportPage.reason(OTHER_REASON_INDEX).click();
      await reportPage.otherReasonInput.fill('x'.repeat(reportReasonMaxLength));
      await reportPage.otherReasonInput.press('y');

      await expect(reportPage.otherReasonInput).toHaveValue('x'.repeat(reportReasonMaxLength));
      await expect(page.getByText(`${reportReasonMaxLength}/${reportReasonMaxLength}`)).toBeVisible();
    });

    test('RPT-006 reason made of spaces only is not accepted', { tag: '@P2' }, async ({ reportPage }) => {
      await reportPage.reason(OTHER_REASON_INDEX).click();
      await reportPage.otherReasonInput.fill('   ');

      await expect(reportPage.submit).toBeDisabled();
    });

    test('RPT-009 Laporkan asks for confirmation and Batal closes it without sending', { tag: '@P2' }, async ({ page, reportPage }) => {
      await reportPage.reason(0).click();
      await reportPage.submit.click();

      await expect(reportPage.confirmDialog).toBeVisible();
      await expect(reportPage.confirmDialog).toContainText('Konfirmasi');
      await reportPage.confirmCancel.click();

      await expect(reportPage.confirmDialog).toBeHidden();
      await expect(page).toHaveURL(/\/report\/story\//);
      await expect(reportPage.reason(0).locator('input')).toBeChecked();
    });

    test('RPT-007 switching from Lainnya to another reason updates the form', { tag: '@P3' }, async ({ reportPage }) => {
      await reportPage.reason(OTHER_REASON_INDEX).click();
      await reportPage.otherReasonInput.fill('Alasan lain');

      await reportPage.reason(0).click();

      await expect(reportPage.otherReasonInput).toBeHidden();
      await expect(reportPage.submit).toBeEnabled();
    });
  });

  test('RPT-008 Batal leaves the report page without sending', { tag: '@P2' }, async ({ page, article, articlePage, reportPage }) => {
    await articlePage.goto(article.path);
    await articlePage.scrollToFooter();
    await articlePage.reportLink.click();
    await reportPage.reason(0).click();

    await reportPage.cancel.click();

    await expect(page).toHaveURL(new RegExp(`${article.slug}$`));
    await expect(articlePage.title).toBeVisible();
    await expect(page.getByText(/berhasil dilaporkan/i)).toHaveCount(0);
  });
});
