/**
 * MongoDB aggregation pipeline examples for Reports (BI).
 * Use with getMongoRepository(Project).aggregate([...]) or manager.aggregate().
 * These are reference pipelines; the current ReportsService uses in-memory
 * aggregation over TypeORM find() for simplicity. Replace with these for scale.
 */

// Example: Total revenue by month (orders collection, lines.total)
export const monthlyRevenuePipeline = (dateFrom?: Date, dateTo?: Date) => {
  const match: any = {};
  if (dateFrom || dateTo) {
    match.dateArrivage = {};
    if (dateFrom) match.dateArrivage.$gte = dateFrom;
    if (dateTo) match.dateArrivage.$lte = dateTo;
  }
  return [
    { $match: match },
    { $unwind: '$lines' },
    {
      $group: {
        _id: {
          year: { $year: '$dateArrivage' },
          month: { $month: '$dateArrivage' },
        },
        total: { $sum: '$lines.total' },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        month: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            { $cond: [{ $lt: ['$_id.month', 10] }, '0', ''] },
            { $toString: '$_id.month' },
          ],
        },
        value: { $round: ['$total', 2] },
      },
    },
  ];
};

// Example: Cost breakdown by project type
export const costBreakdownByTypePipeline = (dateFrom?: Date, dateTo?: Date) => {
  const match: any = {};
  if (dateFrom) match.dateD = { $gte: dateFrom };
  if (dateTo) match.dateF = { $lte: dateTo };
  return [
    { $match: Object.keys(match).length ? match : {} },
    { $group: { _id: '$type', value: { $sum: '$cout' } } },
    { $project: { name: '$_id', value: { $round: ['$value', 2] }, _id: 0 } },
  ];
};

// Example: Active projects count (dateF >= now)
export const activeProjectsPipeline = () => [
  { $match: { dateF: { $gte: new Date() } } },
  { $count: 'activeProjects' },
];
