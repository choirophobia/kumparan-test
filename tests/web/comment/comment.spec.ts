import { test, expect, useLoggedInUser } from '../../../src/fixtures/test';
import { findArticleByComments } from '../../../src/fixtures/article-picker';
import { comments } from '../../../src/data/test-data';

// Comments are never sent. Tests type text, check the send button state,
// then clear the box.

test.describe('Comments (reading)', () => {
  test('CMT-001 comment button opens the response page', { tag: '@P1' }, async ({ page, article, articlePage, commentPage }) => {
    await articlePage.goto(article.path);
    await articlePage.commentButton.click();

    await expect(page).toHaveURL(new RegExp(`/${article.channel}/response/${article.slug}`));
    await expect(commentPage.selectedArticle).toBeVisible();
    await expect(commentPage.input).toBeVisible();
  });

  test('CMT-002 article without comments shows the empty message', { tag: '@P3' }, async ({ page, commentPage }) => {
    const target = await findArticleByComments(page, 'none');
    test.skip(!target, 'every story on the homepage already has comments');

    await commentPage.goto(target!);
    await expect(commentPage.noComment).toHaveText('Belum ada komentar');
  });

  test('CMT-006 existing comments show avatar, name, time and text', { tag: '@P2' }, async ({ page, commentPage }) => {
    const target = await findArticleByComments(page, 'some');
    test.skip(!target, 'no story on the homepage has comments yet');

    await commentPage.goto(target!);
    const items = commentPage.items;
    await expect(items.first()).toBeVisible();

    for (const item of await items.all()) {
      await expect(item.getByTestId('commenter-profpict')).toBeVisible();
      await expect(item.getByTestId('commenter-name')).not.toBeEmpty();
      await expect(item.getByTestId('date')).not.toBeEmpty();
      await expect(item.getByTestId('content')).not.toBeEmpty();
    }
  });

  test('CMT-007 browser Back from the response page returns to the article', { tag: '@P3' }, async ({ page, article, articlePage }) => {
    await articlePage.goto(article.path);
    const title = (await articlePage.title.innerText()).trim();
    await articlePage.commentButton.click();
    await expect(page).toHaveURL(/\/response\//);

    await page.goBack();

    await expect(articlePage.title).toHaveText(title);
  });
});

test.describe('Comments (writing, logged in)', () => {
  useLoggedInUser();

  test.beforeEach(async ({ article, commentPage }) => {
    await commentPage.goto(article);
  });

  test.afterEach(async ({ commentPage }) => {
    await commentPage.input.fill('');
  });

  test('CMT-003 typing a comment enables the send button', { tag: '@P1' }, async ({ commentPage }) => {
    await commentPage.input.fill(comments.normal);

    await expect(commentPage.input).toHaveValue(comments.normal);
    await expect(commentPage.sendButton).toBeEnabled();
  });

  test('CMT-004 empty or whitespace-only comment cannot be sent', { tag: '@P2' }, async ({ commentPage }) => {
    await expect(commentPage.input).toHaveValue('');
    await expect(commentPage.sendButton, 'send is enabled for an empty comment').toBeDisabled();

    await commentPage.input.fill(comments.whitespace);
    await expect(commentPage.sendButton, 'send is enabled for a blank comment').toBeDisabled();
  });

  test('CMT-005 long, multi-line and emoji comments are handled', { tag: '@P3' }, async ({ page, commentPage }) => {
    for (const text of [comments.multiline, comments.emoji, comments.long]) {
      await commentPage.input.fill(text);
      const value = await commentPage.input.inputValue();
      expect(text.startsWith(value) && value.length > 0, 'textarea lost or changed the text').toBe(true);
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'long comment pushes the page sideways').toBeLessThanOrEqual(0);
  });
});
