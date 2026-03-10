export interface DigestData {
  businessName: string;
  newReviewsCount: number;
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
  bestReview: { rating: number; comment: string; customerName: string | null } | null;
  worstReview: { rating: number; comment: string; customerName: string | null } | null;
  dashboardUrl: string;
}

export function buildDigestEmailHtml(data: DigestData): string {
  const {
    businessName,
    newReviewsCount,
    averageRating,
    positiveCount,
    negativeCount,
    bestReview,
    worstReview,
    dashboardUrl,
  } = data;

  const totalWithRating = positiveCount + negativeCount;
  const positivePercent = totalWithRating > 0
    ? Math.round((positiveCount / totalWithRating) * 100)
    : 0;

  const starsDisplay = averageRating > 0 ? averageRating.toFixed(1) : 'N/A';

  const highlightSection = bestReview
    ? `
        <tr>
          <td style="padding: 0 32px 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a1a;">Highlights</h3>
            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; border-radius: 4px;">
              <div style="font-size: 13px; color: #666; margin-bottom: 4px;">
                ${'&#9733;'.repeat(bestReview.rating)}${' '}${bestReview.customerName ? `&mdash; ${bestReview.customerName}` : ''}
              </div>
              <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.5;">
                &ldquo;${escapeHtml(bestReview.comment)}&rdquo;
              </p>
            </div>
          </td>
        </tr>`
    : '';

  const needsAttentionSection = worstReview
    ? `
        <tr>
          <td style="padding: 0 32px 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #1a1a1a;">Needs Attention</h3>
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px;">
              <div style="font-size: 13px; color: #666; margin-bottom: 4px;">
                ${'&#9733;'.repeat(worstReview.rating)}${' '}${worstReview.customerName ? `&mdash; ${worstReview.customerName}` : ''}
              </div>
              <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.5;">
                &ldquo;${escapeHtml(worstReview.comment)}&rdquo;
              </p>
            </div>
          </td>
        </tr>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <tr>
      <td style="text-align: center; padding-bottom: 24px;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          InsightReviews
        </h1>
      </td>
    </tr>
    <!-- Main Card -->
    <tr>
      <td>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <!-- Title -->
          <tr>
            <td style="padding: 32px 32px 8px;">
              <h2 style="margin: 0; font-size: 20px; color: #1a1a1a;">Your Weekly Review Summary</h2>
              <p style="margin: 8px 0 0; font-size: 14px; color: #888;">${businessName}</p>
            </td>
          </tr>
          <!-- Stats Cards -->
          <tr>
            <td style="padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align: center; padding: 16px 8px; background: #f8fafc; border-radius: 12px;">
                    <div style="font-size: 28px; font-weight: 700; color: #2563eb;">${newReviewsCount}</div>
                    <div style="font-size: 12px; color: #888; margin-top: 4px;">New Reviews</div>
                  </td>
                  <td width="6"></td>
                  <td width="33%" style="text-align: center; padding: 16px 8px; background: #f8fafc; border-radius: 12px;">
                    <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">${starsDisplay}</div>
                    <div style="font-size: 12px; color: #888; margin-top: 4px;">Avg Rating</div>
                  </td>
                  <td width="6"></td>
                  <td width="33%" style="text-align: center; padding: 16px 8px; background: #f8fafc; border-radius: 12px;">
                    <div style="font-size: 28px; font-weight: 700; color: #22c55e;">${positivePercent}%</div>
                    <div style="font-size: 12px; color: #888; margin-top: 4px;">Positive</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${highlightSection}
          ${needsAttentionSection}
          ${newReviewsCount === 0 ? `
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="margin: 0; font-size: 14px; color: #888; text-align: center;">
                No new reviews this week. Consider sending more review requests to boost your feedback.
              </p>
            </td>
          </tr>` : ''}
          <!-- CTA -->
          <tr>
            <td style="padding: 8px 32px 32px; text-align: center;">
              <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                View Dashboard
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 24px 0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #999; line-height: 1.6;">
          You are receiving this because you have weekly email digests enabled.<br>
          To unsubscribe, go to Settings &rarr; Notifications in your dashboard and disable the weekly digest.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function buildDigestEmailText(data: DigestData): string {
  const {
    businessName,
    newReviewsCount,
    averageRating,
    positiveCount,
    negativeCount,
    bestReview,
    worstReview,
    dashboardUrl,
  } = data;

  const totalWithRating = positiveCount + negativeCount;
  const positivePercent = totalWithRating > 0
    ? Math.round((positiveCount / totalWithRating) * 100)
    : 0;

  let text = `Your Weekly Review Summary - ${businessName}\n\n`;
  text += `New Reviews: ${newReviewsCount}\n`;
  text += `Average Rating: ${averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}\n`;
  text += `Positive: ${positivePercent}%\n\n`;

  if (bestReview) {
    const reviewer = bestReview.customerName || 'A customer';
    text += `Highlight: ${reviewer} left a ${bestReview.rating}-star review:\n"${bestReview.comment}"\n\n`;
  }

  if (worstReview) {
    const reviewer = worstReview.customerName || 'A customer';
    text += `Needs Attention: ${reviewer} left a ${worstReview.rating}-star review:\n"${worstReview.comment}"\n\n`;
  }

  if (newReviewsCount === 0) {
    text += 'No new reviews this week. Consider sending more review requests to boost your feedback.\n\n';
  }

  text += `View Dashboard: ${dashboardUrl}\n\n`;
  text += 'To unsubscribe, go to Settings > Notifications in your dashboard and disable the weekly digest.';

  return text;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
