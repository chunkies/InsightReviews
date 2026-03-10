/**
 * Fire a webhook POST request to the given URL with the given payload.
 * Returns true on success, false on failure. Never throws.
 */
export async function fireWebhook(
  webhookUrl: string,
  payload: object
): Promise<boolean> {
  try {
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
