import { Chip, type ChipProps } from '@mui/material';

const STATUS_COLORS: Record<string, ChipProps['color']> = {
  sent: 'info',
  completed: 'success',
  expired: 'default',
  failed: 'error',
  active: 'success',
  trial: 'warning',
  cancelled: 'default',
  past_due: 'error',
  delivered: 'success',
  queued: 'default',
};

interface StatusChipProps {
  status: string;
}

export function StatusChip({ status }: StatusChipProps) {
  return (
    <Chip
      label={status.replace('_', ' ')}
      color={STATUS_COLORS[status] ?? 'default'}
      size="small"
      sx={{ textTransform: 'capitalize' }}
    />
  );
}
