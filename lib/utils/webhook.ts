function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/, /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./, /^169\.254\./, /^0\./, /^\[::1\]$/, /^\[fd/, /^\[fe80:/,
      /^metadata\.google\.internal$/, /\.internal$/, /\.local$/,
    ];
    return blockedPatterns.some(p => p.test(hostname));
  } catch {
    return true;
  }
}

/**
 * Fire a webhook POST request to the given URL with the given payload.
 * Returns true on success, false on failure. Never throws.
 */
export async function fireWebhook(
  webhookUrl: string,
  payload: object
): Promise<boolean> {
  try {
    if (isPrivateUrl(webhookUrl)) {
      console.error(`Webhook blocked: private/internal URL ${webhookUrl}`);
      return false;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'InsightReviews-Webhook/1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `Webhook failed: ${response.status} ${response.statusText} for URL ${webhookUrl}`
      );
      return false;
    }

    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Webhook timed out after 5s for URL ${webhookUrl}`);
    } else {
      console.error(
        'Webhook error:',
        error instanceof Error ? error.message : 'Unknown error',
        `URL: ${webhookUrl}`
      );
    }
    return false;
  }
}
