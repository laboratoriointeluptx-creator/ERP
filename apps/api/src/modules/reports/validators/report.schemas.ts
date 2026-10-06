import { z } from 'zod';

export const createReportSchema = z.object({
  code: z.string().min(1).max(30).toUpperCase(),
  name: z.string().min(1).max(160),
  description: z.string().max(1000).optional(),
  category: z.enum(['FINANCIAL', 'SALES', 'PURCHASES', 'INVENTORY', 'PRODUCTION', 'HR', 'PROJECTS', 'SERVICES', 'CUSTOM', 'EXECUTIVE']).default('CUSTOM'),
  type: z.enum(['TABLE', 'CHART', 'PIVOT', 'DASHBOARD', 'EXPORT']).default('TABLE'),
  dataSource: z.string().min(1).max(100),
  query: z.unknown(),
  parameters: z.array(z.object({
    name: z.string().min(1).max(50),
    type: z.enum(['STRING', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTISELECT']),
    label: z.string().min(1).max(100),
    required: z.boolean().default(false),
    defaultValue: z.unknown().optional(),
    options: z.array(z.object({ value: z.unknown(), label: z.string() })).optional(),
  })).optional(),
  columns: z.array(z.object({
    field: z.string().min(1).max(50),
    label: z.string().min(1).max(100),
    type: z.enum(['STRING', 'NUMBER', 'CURRENCY', 'PERCENTAGE', 'DATE', 'DATETIME', 'BOOLEAN']).default('STRING'),
    format: z.string().max(50).optional(),
    width: z.coerce.number().int().positive().optional(),
    sortable: z.boolean().default(true),
    filterable: z.boolean().default(true),
    aggregation: z.enum(['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'NONE']).default('NONE'),
  })).optional(),
  filters: z.array(z.object({
    field: z.string().min(1).max(50),
    operator: z.enum(['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'NOT_IN', 'LIKE', 'BETWEEN']),
    value: z.unknown(),
  })).optional(),
  sort: z.array(z.object({
    field: z.string().min(1).max(50),
    direction: z.enum(['ASC', 'DESC']),
  })).optional(),
  groupBy: z.array(z.string().max(50)).optional(),
  chartConfig: z.object({
    type: z.enum(['BAR', 'LINE', 'PIE', 'AREA', 'SCATTER', 'HEATMAP']),
    xAxis: z.string().max(50).optional(),
    yAxis: z.string().max(50).optional(),
    series: z.array(z.object({ field: z.string().max(50), label: z.string().max(100), color: z.string().max(7) })).optional(),
  }).optional(),
  isPublic: z.boolean().default(false),
  isScheduled: z.boolean().default(false),
  scheduleCron: z.string().max(100).optional(),
  scheduleRecipients: z.array(z.string().email().max(160)).optional(),
  scheduleFormat: z.enum(['PDF', 'EXCEL', 'CSV', 'HTML']).default('PDF'),
});

export const updateReportSchema = createReportSchema.partial();

export const reportQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  category: z.enum(['FINANCIAL', 'SALES', 'PURCHASES', 'INVENTORY', 'PRODUCTION', 'HR', 'PROJECTS', 'SERVICES', 'CUSTOM', 'EXECUTIVE']).optional(),
  type: z.enum(['TABLE', 'CHART', 'PIVOT', 'DASHBOARD', 'EXPORT']).optional(),
  isPublic: z.coerce.boolean().optional(),
  isScheduled: z.coerce.boolean().optional(),
  search: z.string().max(160).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ReportQuery = z.infer<typeof reportQuerySchema>;