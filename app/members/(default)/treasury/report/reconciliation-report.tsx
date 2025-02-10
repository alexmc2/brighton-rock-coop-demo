// 'use client';

// import { format } from 'date-fns';
// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
// } from '@/components/members/ui/card';
// import {
//   Table,
//   TableHeader,
//   TableBody,
//   TableHead,
//   TableRow,
//   TableCell,
// } from '@/components/members/ui/table';
// import { Badge } from '@/components/members/ui/badge';

// interface ReconciliationReportProps {
//   month: string;
//   opening_balance: number;
//   closing_balance: number;
//   total_income: number;
//   total_expenses: number;
//   opening_date: string;
//   closing_date: string;
//   is_reconciled: boolean;
//   transactions: any[];
// }

// export default function ReconciliationReport({
//   month,
//   opening_balance,
//   closing_balance,
//   total_income,
//   total_expenses,
//   opening_date,
//   closing_date,
//   is_reconciled,
//   transactions,
// }: ReconciliationReportProps) {
//   return (
//     <Card className="w-full max-w-4xl mx-auto">
//       <CardHeader className="flex flex-row items-center justify-between">
//         <div>
//           <CardTitle className="text-2xl font-medium">
//             Bank Reconciliation Report
//           </CardTitle>
//           <p className="text-muted-foreground mt-1">
//             {format(new Date(month), 'MMMM yyyy')}
//           </p>
//         </div>
//         <Badge
//           variant={is_reconciled ? 'default' : 'secondary'}
//           className={is_reconciled ? 'bg-emerald-500' : undefined}
//         >
//           {is_reconciled ? 'Reconciled' : 'Pending'}
//         </Badge>
//       </CardHeader>

//       <CardContent>
//         <div className="grid grid-cols-4 gap-5 mb-8">
//           <div>
//             <p className="text-muted-foreground text-sm">Opening Balance</p>
//             <p className="text-2xl font-medium">
//               £{opening_balance.toFixed(2)}
//             </p>
//             <p className="text-muted-foreground text-sm">
//               {format(new Date(opening_date), 'M/d/yyyy')}
//             </p>
//           </div>
//           <div>
//             <p className="text-muted-foreground text-sm">Closing Balance</p>
//             <p className="text-2xl font-medium">
//               £{closing_balance.toFixed(2)}
//             </p>
//             <p className="text-muted-foreground text-sm">
//               {format(new Date(closing_date), 'M/d/yyyy')}
//             </p>
//           </div>
//           <div>
//             <p className="text-muted-foreground text-sm">Total Income</p>
//             <p className="text-2xl font-medium text-emerald-600">
//               £{total_income.toFixed(2)}
//             </p>
//             <p className="text-emerald-600 text-sm flex items-center">
//               ↑ Receipts
//             </p>
//           </div>
//           <div>
//             <p className="text-muted-foreground text-sm">Total Expenses</p>
//             <p className="text-2xl font-medium text-red-600">
//               £{total_expenses.toFixed(2)}
//             </p>
//             <p className="text-red-600 text-sm flex items-center">↓ Payments</p>
//           </div>
//         </div>

//         <div className="mt-10">
//           <h2 className="text-xl font-medium mb-5">Transaction Details</h2>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Date</TableHead>
//                 <TableHead>Description</TableHead>
//                 <TableHead>Type</TableHead>
//                 <TableHead>Category</TableHead>
//                 <TableHead className="text-right">Amount</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {transactions.map((tx) => (
//                 <TableRow key={tx.id}>
//                   <TableCell>{format(new Date(tx.date), 'M/d/yyyy')}</TableCell>
//                   <TableCell>
//                     <div className="font-medium">{tx.paid_to}</div>
//                     {tx.description && (
//                       <div className="text-sm text-muted-foreground mt-1">
//                         {tx.description}
//                       </div>
//                     )}
//                   </TableCell>
//                   <TableCell>
//                     <span
//                       className={
//                         tx.splits.some((s: any) => s.category?.is_expense)
//                           ? 'text-red-600'
//                           : 'text-emerald-600'
//                       }
//                     >
//                       {tx.splits.some((s: any) => s.category?.is_expense)
//                         ? 'Payment'
//                         : 'Receipt'}
//                     </span>
//                   </TableCell>
//                   <TableCell>
//                     {tx.splits.length === 1 ? (
//                       <Badge variant="secondary" className="font-normal">
//                         {tx.splits[0].category?.name}
//                       </Badge>
//                     ) : (
//                       <div className="space-y-1">
//                         {tx.splits.map((split: any) => (
//                           <div
//                             key={split.id}
//                             className="flex justify-between text-sm"
//                           >
//                             <Badge
//                               variant="secondary"
//                               className="font-normal mr-2"
//                             >
//                               {split.category?.name}
//                             </Badge>
//                             <span>£{split.amount.toFixed(2)}</span>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </TableCell>
//                   <TableCell
//                     className={`text-right font-medium ${
//                       tx.splits.some((s: any) => s.category?.is_expense)
//                         ? 'text-red-600'
//                         : 'text-emerald-600'
//                     }`}
//                   >
//                     {tx.splits.some((s: any) => s.category?.is_expense)
//                       ? '-'
//                       : '+'}
//                     £{tx.total_amount.toFixed(2)}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
