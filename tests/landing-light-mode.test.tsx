import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useTheme } from '@mui/material/styles';
import { LandingThemeProvider } from '@/components/landing/landing-theme-provider';
import { AppThemeProvider } from '@/components/providers/theme-provider';

/** Renders the current MUI theme's palette mode and text colors */
function ThemeInspector() {
  const theme = useTheme();
  return (
    <div>
      <span data-testid="palette-mode">{theme.palette.mode}</span>
      <span data-testid="text-primary">{theme.palette.text.primary}</span>
      <span data-testid="text-secondary">{theme.palette.text.secondary}</span>
      <span data-testid="bg-default">{theme.palette.background.default}</span>
      <span data-testid="bg-paper">{theme.palette.background.paper}</span>
    </div>
  );
}

describe('Landing page always uses light mode', () => {
  it('LandingThemeProvider forces light palette mode', () => {
    render(
      <LandingThemeProvider>
        <ThemeInspector />
      </LandingThemeProvider>,
    );

    expect(screen.getByTestId('palette-mode').textContent).toBe('light');
  });

  it('has dark text colors readable on white backgrounds', () => {
    render(
      <LandingThemeProvider>
        <ThemeInspector />
      </LandingThemeProvider>,
    );

    // text.primary must be dark (not light/pale)
    const textPrimary = screen.getByTestId('text-primary').textContent!;
    expect(textPrimary).toBe('#0f172a');

    // text.secondary must be a medium gray, not a pale color
    const textSecondary = screen.getByTestId('text-secondary').textContent!;
    expect(textSecondary).toBe('#64748b');
  });

  it('has light background colors', () => {
    render(
      <LandingThemeProvider>
        <ThemeInspector />
      </LandingThemeProvider>,
    );

    expect(screen.getByTestId('bg-default').textContent).toBe('#f8fafc');
    expect(screen.getByTestId('bg-paper').textContent).toBe('#ffffff');
  });

  it('stays light even when nested inside a dark AppThemeProvider', () => {
    // Simulate the real app: AppThemeProvider (could be dark) wraps layout,
    // LandingThemeProvider overrides it for the landing page
    render(
      <AppThemeProvider>
        <LandingThemeProvider>
          <ThemeInspector />
        </LandingThemeProvider>
      </AppThemeProvider>,
    );

    expect(screen.getByTestId('palette-mode').textContent).toBe('light');
    expect(screen.getByTestId('text-primary').textContent).toBe('#0f172a');
    expect(screen.getByTestId('text-secondary').textContent).toBe('#64748b');
  });

  it('renders children', () => {
    render(
      <LandingThemeProvider>
        <span>Hello landing</span>
      </LandingThemeProvider>,
    );

    expect(screen.getByText('Hello landing')).toBeInTheDocument();
  });
});
