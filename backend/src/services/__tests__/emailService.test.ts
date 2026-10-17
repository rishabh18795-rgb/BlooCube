import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { sendEmail, passwordResetEmailTemplate } from '../emailService';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

test('passwordResetEmailTemplate embeds the reset URL in both html and text, and nothing else sensitive', () => {
  const resetUrl = 'https://bloocube.com/reset-password/abc123token';
  const { html, text } = passwordResetEmailTemplate(resetUrl);
  assert.ok(html.includes(resetUrl), 'html should contain the reset URL');
  assert.ok(text.includes(resetUrl), 'text should contain the reset URL');
  assert.ok(html.includes('30 minutes'), 'html should state the expiry window');
});

test('sendEmail reports not_configured when RESEND_API_KEY/EMAIL_FROM are unset, without throwing', async () => {
  const result = await sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>hi</p>', text: 'hi' });
  assert.deepEqual(result, { sent: false, reason: 'not_configured' });
});

test('sendEmail reports sent:true when the injected client succeeds', async () => {
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'BlooCube <test@bloocube.com>';
  const fakeClient = {
    emails: {
      send: async () => ({ data: { id: 'email_123' }, error: null }),
    },
  };
  const result = await sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>hi</p>', text: 'hi' }, fakeClient);
  assert.deepEqual(result, { sent: true });
});

test('sendEmail reports provider_error (not sent:true) when the provider rejects the send', async () => {
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'BlooCube <test@bloocube.com>';
  const fakeClient = {
    emails: {
      send: async () => ({ data: null, error: { name: 'validation_error' } }),
    },
  };
  const result = await sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>hi</p>', text: 'hi' }, fakeClient);
  assert.deepEqual(result, { sent: false, reason: 'provider_error' });
});

test('sendEmail reports exception (not sent:true) when the client throws', async () => {
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'BlooCube <test@bloocube.com>';
  const fakeClient = {
    emails: {
      send: async () => { throw new Error('network down'); },
    },
  };
  const result = await sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>hi</p>', text: 'hi' }, fakeClient);
  assert.deepEqual(result, { sent: false, reason: 'exception' });
});
