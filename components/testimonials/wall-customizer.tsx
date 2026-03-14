'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Slider, Switch,
  FormControlLabel, ToggleButtonGroup, ToggleButton,
  Select, MenuItem, InputLabel, FormControl, Alert, IconButton,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  Palette, Type, LayoutGrid, Image, Save, RotateCcw,
  ChevronDown, Eye, Columns3, Columns2, Square, Sparkles,
} from 'lucide-react';
import { useSnackbar } from '@/components/providers/snackbar-provider';
import type { WallConfig } from '@/lib/types/wall-config';
import { DEFAULT_WALL_CONFIG } from '@/lib/types/wall-config';

// ── Theme Presets ──────────────────────────────────────────────────────────

interface ThemePreset {
  name: string;
  config: WallConfig;
  /** Colors used for the thumbnail preview: [bg1, bg2, card, accent] */
  preview: [string, string, string, string];
}

const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'Clean',
    preview: ['#f0f4ff', '#f0fdf4', '#ffffff', '#6366f1'],
    config: { ...DEFAULT_WALL_CONFIG },
  },
  {
    name: 'Dark',
    preview: ['#1a1a2e', '#16213e', '#1e293b', '#f59e0b'],
    config: {
      ...DEFAULT_WALL_CONFIG,
      bgType: 'gradient',
      bgColor: '#1a1a2e',
      bgGradientFrom: '#1a1a2e',
      bgGradientTo: '#16213e',
      bgGradientAngle: 145,
      cardBg: '#1e293b',
      cardBorderRadius: 12,
      cardShadow: 'lg',
      headerFont: 'Inter, system-ui, sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      headerColor: '#f1f5f9',
      bodyColor: '#cbd5e1',
      headerSize: 1,
      starColor: '#f59e0b',
      accentColor: '#f59e0b',
    },
  },
  {
    name: 'Warm',
    preview: ['#fef3c7', '#fef9ef', '#ffffff', '#f97316'],
    config: {
      ...DEFAULT_WALL_CONFIG,
      bgType: 'gradient',
      bgColor: '#fef3c7',
      bgGradientFrom: '#fef3c7',
      bgGradientTo: '#fef9ef',
      bgGradientAngle: 145,
      cardBg: '#ffffff',
      cardBorderRadius: 14,
      cardShadow: 'md',
      headerFont: 'Georgia, serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      headerColor: '#78350f',
      bodyColor: '#92400e',
      headerSize: 1,
      starColor: '#f97316',
      accentColor: '#f97316',
    },
  },
  {
    name: 'Ocean',
    preview: ['#0ea5e9', '#06b6d4', '#ffffffdd', '#0891b2'],
    config: {
      ...DEFAULT_WALL_CONFIG,
      bgType: 'gradient',
      bgColor: '#0ea5e9',
      bgGradientFrom: '#0ea5e9',
      bgGradientTo: '#06b6d4',
      bgGradientAngle: 135,
      cardBg: '#ffffffdd',
      cardBorderRadius: 16,
      cardShadow: 'md',
      headerFont: '"DM Sans", sans-serif',
      bodyFont: '"DM Sans", sans-serif',
      headerColor: '#0c4a6e',
      bodyColor: '#164e63',
      headerSize: 1,
      starColor: '#0891b2',
      accentColor: '#0891b2',
    },
  },
  {
    name: 'Rose',
    preview: ['#fce7f3', '#fdf2f8', '#ffffff', '#ec4899'],
    config: {
      ...DEFAULT_WALL_CONFIG,
      bgType: 'gradient',
      bgColor: '#fce7f3',
      bgGradientFrom: '#fce7f3',
      bgGradientTo: '#fdf2f8',
      bgGradientAngle: 145,
      cardBg: '#ffffff',
      cardBorderRadius: 14,
      cardShadow: 'md',
      headerFont: '"Playfair Display", serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      headerColor: '#831843',
      bodyColor: '#9d174d',
      headerSize: 1.05,
      starColor: '#ec4899',
      accentColor: '#ec4899',
    },
  },
  {
    name: 'Forest',
    preview: ['#064e3b', '#065f46', '#0f766e', '#34d399'],
    config: {
      ...DEFAULT_WALL_CONFIG,
      bgType: 'gradient',
      bgColor: '#064e3b',
      bgGradientFrom: '#064e3b',
      bgGradientTo: '#065f46',
      bgGradientAngle: 145,
      cardBg: '#0f766e',
      cardBorderRadius: 12,
      cardShadow: 'lg',
      headerFont: '"Space Grotesk", sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      headerColor: '#a7f3d0',
      bodyColor: '#6ee7b7',
      headerSize: 1,
      starColor: '#34d399',
      accentColor: '#34d399',
    },
  },
  {
    name: 'Minimal',
    preview: ['#ffffff', '#ffffff', '#ffffff', '#6b7280'],
    config: {
      ...DEFAULT_WALL_CONFIG,
      bgType: 'solid',
      bgColor: '#ffffff',
      bgGradientFrom: '#ffffff',
      bgGradientTo: '#ffffff',
      bgGradientAngle: 0,
      cardBg: '#ffffff',
      cardBorderRadius: 8,
      cardShadow: 'sm',
      headerFont: 'Inter, system-ui, sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      headerColor: '#111827',
      bodyColor: '#4b5563',
      headerSize: 0.95,
      starColor: '#6b7280',
      accentColor: '#6b7280',
    },
  },
];

interface WallCustomizerProps {
  orgId: string;
  initialConfig: WallConfig;
  wallUrl: string;
  reviewUrl: string;
  onConfigChange?: (config: WallConfig) => void;
}

const FONT_OPTIONS = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter (Default)' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Playfair Display", serif', label: 'Playfair Display' },
  { value: '"DM Sans", sans-serif', label: 'DM Sans' },
  { value: '"Space Grotesk", sans-serif', label: 'Space Grotesk' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
];

const SHADOW_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Subtle' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Bold' },
];

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  // Local state makes the color picker drag instant — parent only updates on debounce
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef(localValue);

  // Sync from parent when value changes externally (e.g. theme preset click)
  useEffect(() => { setLocalValue(value); }, [value]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setLocalValue(v);
    latestRef.current = v;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(latestRef.current), 150);
  }, [onChange]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
      <Box
        component="input"
        type="color"
        value={localValue}
        onChange={handleChange}
        sx={{
          width: 36,
          height: 36,
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          cursor: 'pointer',
          p: 0,
          '&::-webkit-color-swatch-wrapper': { p: '2px' },
          '&::-webkit-color-swatch': { borderRadius: 1, border: 'none' },
        }}
      />
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {localValue}
        </Typography>
      </Box>
    </Box>
  );
}


export function WallCustomizer({ orgId, initialConfig, wallUrl, reviewUrl, onConfigChange }: WallCustomizerProps) {
  const [config, setConfig] = useState<WallConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const { showSnackbar } = useSnackbar();

  // Debounce onConfigChange to avoid re-render storms from color pickers
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestConfigRef = useRef<WallConfig>(config);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const update = useCallback(<K extends keyof WallConfig>(key: K, value: WallConfig[K]) => {
    setConfig(prev => {
      const next = { ...prev, [key]: value };
      latestConfigRef.current = next;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onConfigChange?.(latestConfigRef.current);
      }, 100);
      return next;
    });
  }, [onConfigChange]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/wall/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, wallConfig: config }),
      });
      if (!res.ok) throw new Error();
      showSnackbar('Wall design saved!', 'success');
    } catch {
      showSnackbar('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }, [orgId, config, showSnackbar]);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_WALL_CONFIG);
    onConfigChange?.(DEFAULT_WALL_CONFIG);
    showSnackbar('Reset to defaults', 'info');
  }, [showSnackbar, onConfigChange]);

  return (
    <Box sx={{ maxWidth: 400 }}>
      <Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Save size={16} />}
            onClick={handleSave}
            disabled={saving}
            sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? 'Saving...' : 'Save Design'}
          </Button>
          <IconButton onClick={handleReset} title="Reset to defaults">
            <RotateCcw size={18} />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Eye size={14} />}
            href={wallUrl}
            target="_blank"
            sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}
          >
            Preview Wall
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Eye size={14} />}
            href={reviewUrl}
            target="_blank"
            sx={{ flex: 1, textTransform: 'none', fontWeight: 600 }}
          >
            Preview Review Page
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
          Design changes apply to both the testimonial wall and the review page.
        </Alert>

        {/* Theme Presets */}
        <Accordion defaultExpanded sx={{ '&:before': { display: 'none' }, borderRadius: '12px !important', mb: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Sparkles size={16} />
              <Typography variant="subtitle2" fontWeight={600}>Themes</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Click a theme to apply it. You can customize further below.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                overflowX: 'auto',
                pb: 1,
                mx: -1,
                px: 1,
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
              }}
            >
              {THEME_PRESETS.map((theme) => {
                const isActive =
                  config.bgGradientFrom === theme.config.bgGradientFrom &&
                  config.bgGradientTo === theme.config.bgGradientTo &&
                  config.cardBg === theme.config.cardBg &&
                  config.accentColor === theme.config.accentColor &&
                  config.bgType === theme.config.bgType &&
                  config.bgColor === theme.config.bgColor;
                return (
                  <Box
                    key={theme.name}
                    onClick={() => {
                      setConfig(theme.config);
                      onConfigChange?.(theme.config);
                      showSnackbar('Click save changes to apply the theme', 'info');
                    }}
                    sx={{
                      flexShrink: 0,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      '&:hover': { transform: 'translateY(-2px)' },
                    }}
                  >
                    {/* Thumbnail */}
                    <Box
                      sx={{
                        width: 72,
                        height: 52,
                        borderRadius: 1.5,
                        background: `linear-gradient(135deg, ${theme.preview[0]} 0%, ${theme.preview[1]} 100%)`,
                        border: isActive ? '2px solid' : '2px solid',
                        borderColor: isActive ? 'primary.main' : 'divider',
                        boxShadow: isActive ? '0 0 0 2px rgba(99,102,241,0.25)' : 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        p: 0.75,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {/* Mini card representation */}
                      <Box
                        sx={{
                          width: '80%',
                          height: 14,
                          borderRadius: 0.5,
                          bgcolor: theme.preview[2],
                          border: '1px solid rgba(0,0,0,0.05)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            bgcolor: theme.preview[3],
                          },
                        }}
                      />
                      <Box
                        sx={{
                          width: '80%',
                          height: 14,
                          borderRadius: 0.5,
                          bgcolor: theme.preview[2],
                          border: '1px solid rgba(0,0,0,0.05)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '2px',
                            bgcolor: theme.preview[3],
                          },
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? 'primary.main' : 'text.secondary',
                        fontSize: '0.68rem',
                        lineHeight: 1.3,
                      }}
                    >
                      {theme.name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Background */}
        <Accordion defaultExpanded sx={{ '&:before': { display: 'none' }, borderRadius: '12px !important', mb: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Palette size={16} />
              <Typography variant="subtitle2" fontWeight={600}>Background</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <ToggleButtonGroup
              value={config.bgType}
              exclusive
              onChange={(_, v) => v && update('bgType', v)}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value="solid">Solid</ToggleButton>
              <ToggleButton value="gradient">Gradient</ToggleButton>
            </ToggleButtonGroup>

            {config.bgType === 'solid' ? (
              <ColorInput label="Background Color" value={config.bgColor} onChange={v => update('bgColor', v)} />
            ) : (
              <>
                <ColorInput label="Gradient Start" value={config.bgGradientFrom} onChange={v => update('bgGradientFrom', v)} />
                <ColorInput label="Gradient End" value={config.bgGradientTo} onChange={v => update('bgGradientTo', v)} />
                <Typography variant="caption" color="text.secondary" gutterBottom>Angle: {config.bgGradientAngle}°</Typography>
                <Slider
                  value={config.bgGradientAngle}
                  onChange={(_, v) => update('bgGradientAngle', v as number)}
                  min={0} max={360} step={5}
                  size="small"
                />
              </>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Cards */}
        <Accordion sx={{ '&:before': { display: 'none' }, borderRadius: '12px !important', mb: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Square size={16} />
              <Typography variant="subtitle2" fontWeight={600}>Cards</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <ColorInput label="Card Background" value={config.cardBg} onChange={v => update('cardBg', v)} />
            <ColorInput label="Accent Color" value={config.accentColor} onChange={v => update('accentColor', v)} />
            <Typography variant="caption" color="text.secondary" gutterBottom>Border Radius: {config.cardBorderRadius}px</Typography>
            <Slider
              value={config.cardBorderRadius}
              onChange={(_, v) => update('cardBorderRadius', v as number)}
              min={0} max={24} step={2}
              size="small"
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Shadow</InputLabel>
              <Select
                value={config.cardShadow}
                label="Shadow"
                onChange={e => update('cardShadow', e.target.value as WallConfig['cardShadow'])}
              >
                {SHADOW_OPTIONS.map(o => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* Typography */}
        <Accordion sx={{ '&:before': { display: 'none' }, borderRadius: '12px !important', mb: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Type size={16} />
              <Typography variant="subtitle2" fontWeight={600}>Typography</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Header Font</InputLabel>
              <Select
                value={config.headerFont}
                label="Header Font"
                onChange={e => update('headerFont', e.target.value)}
              >
                {FONT_OPTIONS.map(f => (
                  <MenuItem key={f.value} value={f.value} sx={{ fontFamily: f.value }}>{f.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Body Font</InputLabel>
              <Select
                value={config.bodyFont}
                label="Body Font"
                onChange={e => update('bodyFont', e.target.value)}
              >
                {FONT_OPTIONS.map(f => (
                  <MenuItem key={f.value} value={f.value} sx={{ fontFamily: f.value }}>{f.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <ColorInput label="Header Color" value={config.headerColor} onChange={v => update('headerColor', v)} />
            <ColorInput label="Body Color" value={config.bodyColor} onChange={v => update('bodyColor', v)} />
            <Typography variant="caption" color="text.secondary" gutterBottom>Header Size: {(config.headerSize * 100).toFixed(0)}%</Typography>
            <Slider
              value={config.headerSize}
              onChange={(_, v) => update('headerSize', v as number)}
              min={0.7} max={1.5} step={0.05}
              size="small"
            />
          </AccordionDetails>
        </Accordion>

        {/* Stars */}
        <Accordion sx={{ '&:before': { display: 'none' }, borderRadius: '12px !important', mb: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Palette size={16} />
              <Typography variant="subtitle2" fontWeight={600}>Stars & Colors</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <ColorInput label="Star Color" value={config.starColor} onChange={v => update('starColor', v)} />
          </AccordionDetails>
        </Accordion>

        {/* Layout */}
        <Accordion sx={{ '&:before': { display: 'none' }, borderRadius: '12px !important', mb: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LayoutGrid size={16} />
              <Typography variant="subtitle2" fontWeight={600}>Layout</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="caption" color="text.secondary" gutterBottom>Columns</Typography>
            <ToggleButtonGroup
              value={config.columns}
              exclusive
              onChange={(_, v) => v && update('columns', v)}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
            >
              <ToggleButton value={1}><Square size={14} /></ToggleButton>
              <ToggleButton value={2}><Columns2 size={14} /></ToggleButton>
              <ToggleButton value={3}><Columns3 size={14} /></ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" gutterBottom>Max Width: {config.maxWidth}px</Typography>
            <Slider
              value={config.maxWidth}
              onChange={(_, v) => update('maxWidth', v as number)}
              min={600} max={1400} step={50}
              size="small"
            />
          </AccordionDetails>
        </Accordion>

        {/* Header & Footer */}
        <Accordion sx={{ '&:before': { display: 'none' }, borderRadius: '12px !important', mb: 1.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Image size={16} />
              <Typography variant="subtitle2" fontWeight={600}>Header & Footer</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              fullWidth
              size="small"
              label="Subtitle Text"
              value={config.headerText}
              onChange={e => update('headerText', e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={<Switch checked={config.showLogo} onChange={(_, v) => update('showLogo', v)} />}
              label="Show Logo"
            />
            <FormControlLabel
              control={<Switch checked={config.showRatingBadge} onChange={(_, v) => update('showRatingBadge', v)} />}
              label="Show Rating Badge"
            />
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
}
