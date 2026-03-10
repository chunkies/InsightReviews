/**
 * Generates a branded review card image using the Canvas API.
 * Returns a Blob suitable for downloading or sharing.
 */

interface ReviewCardData {
  rating: number;
  comment: string | null;
  customerName: string | null;
}

const CARD_SIZE = 1080;
const PADDING = 80;
const STAR_CHAR = '\u2605'; // filled star
const STAR_EMPTY = '\u2606'; // empty star

/**
 * Wraps text to fit within a given max width, returning an array of lines.
 */
function wrapText(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Converts a hex color string to an rgba string.
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generates a branded review card image (1080x1080 for Instagram).
 *
 * @param review - The review data (rating, comment, customer name)
 * @param orgName - The business/organization name
 * @param accentColor - Hex color for branding (e.g. "#2e7d32")
 * @returns A Blob of the PNG image
 */
export async function generateReviewCard(
  review: ReviewCardData,
  orgName: string,
  accentColor: string = '#1976d2',
): Promise<Blob> {
  const canvas = new OffscreenCanvas(CARD_SIZE, CARD_SIZE);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2d context from OffscreenCanvas');
  }

  // --- Background gradient ---
  const gradient = ctx.createLinearGradient(0, 0, CARD_SIZE, CARD_SIZE);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(0.6, '#f8f9fa');
  gradient.addColorStop(1, hexToRgba(accentColor, 0.08));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  // --- Accent stripe at the top ---
  const stripeGradient = ctx.createLinearGradient(0, 0, CARD_SIZE, 0);
  stripeGradient.addColorStop(0, accentColor);
  stripeGradient.addColorStop(1, hexToRgba(accentColor, 0.7));
  ctx.fillStyle = stripeGradient;
  ctx.fillRect(0, 0, CARD_SIZE, 12);

  // --- Decorative quote mark ---
  ctx.font = 'bold 200px Georgia, serif';
  ctx.fillStyle = hexToRgba(accentColor, 0.08);
  ctx.textAlign = 'left';
  ctx.fillText('\u201C', PADDING - 20, 240);

  // --- Star rating ---
  const starY = 300;
  const starSize = 48;
  ctx.font = `${starSize}px sans-serif`;
  ctx.textAlign = 'center';

  const starsText = Array.from({ length: 5 }, (_, i) =>
    i < review.rating ? STAR_CHAR : STAR_EMPTY
  ).join(' ');

  ctx.fillStyle = '#f9a825';
  ctx.fillText(starsText, CARD_SIZE / 2, starY);

  // --- Review comment ---
  const commentText = review.comment || 'Great experience!';
  ctx.font = 'italic 36px Georgia, serif';
  ctx.fillStyle = '#333333';
  ctx.textAlign = 'center';

  const maxTextWidth = CARD_SIZE - PADDING * 2;
  const lines = wrapText(ctx, `"${commentText}"`, maxTextWidth);
  const lineHeight = 52;
  const maxLines = 8;
  const displayLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    displayLines[maxLines - 1] = displayLines[maxLines - 1].replace(/\s*\S*$/, '...');
  }

  const textStartY = 380;
  for (let i = 0; i < displayLines.length; i++) {
    ctx.fillText(displayLines[i], CARD_SIZE / 2, textStartY + i * lineHeight);
  }

  // --- Customer name ---
  const nameY = textStartY + displayLines.length * lineHeight + 50;
  const displayName = review.customerName || 'A Customer';
  ctx.font = 'bold 32px Arial, sans-serif';
  ctx.fillStyle = '#555555';
  ctx.textAlign = 'center';
  ctx.fillText(`\u2014 ${displayName}`, CARD_SIZE / 2, nameY);

  // --- Verified Review badge ---
  const badgeY = nameY + 60;
  const badgeText = '\u2713 Verified Review';
  ctx.font = '22px Arial, sans-serif';
  const badgeMetrics = ctx.measureText(badgeText);
  const badgeWidth = badgeMetrics.width + 40;
  const badgeHeight = 38;
  const badgeX = (CARD_SIZE - badgeWidth) / 2;

  // Badge background
  ctx.beginPath();
  const radius = 19;
  ctx.moveTo(badgeX + radius, badgeY);
  ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
  ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
  ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
  ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
  ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
  ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
  ctx.lineTo(badgeX, badgeY + radius);
  ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(accentColor, 0.12);
  ctx.fill();

  // Badge text
  ctx.fillStyle = accentColor;
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, CARD_SIZE / 2, badgeY + 27);

  // --- Business name at the bottom ---
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillStyle = accentColor;
  ctx.textAlign = 'center';
  ctx.fillText(orgName, CARD_SIZE / 2, CARD_SIZE - PADDING - 30);

  // --- "Powered by InsightReviews" ---
  ctx.font = '18px Arial, sans-serif';
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText('via InsightReviews', CARD_SIZE / 2, CARD_SIZE - PADDING);

  // --- Bottom accent stripe ---
  ctx.fillStyle = stripeGradient;
  ctx.fillRect(0, CARD_SIZE - 12, CARD_SIZE, 12);

  return canvas.convertToBlob({ type: 'image/png' });
}
