// import { format } from 'date-fns';
// import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
// import type { TreasuryTransaction } from '@/types/members/treasury';

// const styles = StyleSheet.create({
//   page: {
//     padding: 40,
//     fontFamily: 'Helvetica',
//   },
//   header: {
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 10,
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 10,
//     color: '#666',
//     marginBottom: 8,
//   },
//   statusWrapper: {
//     marginBottom: 20,
//   },
//   status: {
//     fontSize: 10,
//     padding: '2px 8px',
//     borderRadius: 16,
//     backgroundColor: '#10b981',
//     color: 'white',
//     alignSelf: 'flex-start',
//   },
//   summarySection: {
//     marginBottom: 20,
//   },
//   summaryRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   summaryColumn: {
//     flex: 1,
//   },
//   summaryLabel: {
//     fontSize: 10,
//     color: '#666',
//     marginBottom: 4,
//   },
//   summaryValue: {
//     fontSize: 10,
//     marginBottom: 2,
//   },
//   summaryDate: {
//     fontSize: 11,
//     color: '#666',
//   },
//   summarySubtext: {
//     fontSize: 10,
//     color: '#666',
//     marginTop: 2,
//   },
//   income: {
//     color: '#10b981',
//   },
//   expense: {
//     color: '#ef4444',
//   },
//   separator: {
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//     marginBottom: 20,
//   },
//   transactionsTitle: {
//     fontSize: 10,
//     marginBottom: 16,
//   },
//   table: {
//     width: '100%',
//   },
//   tableHeader: {
//     flexDirection: 'row',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//     paddingBottom: 8,
//     marginBottom: 8,
//   },
//   tableHeaderCell: {
//     fontSize: 10,
//     color: '#666',
//   },
//   tableRow: {
//     flexDirection: 'row',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//     paddingVertical: 8,
//   },
//   col1: { width: '15%' },
//   col2: { width: '20%' },
//   col3: { width: '15%' },
//   col4: { width: '20%' },
//   col5: { width: '15%' },
//   col6: { width: '15%', textAlign: 'right' },
//   tableCell: {
//     fontSize: 10,
//   },
//   categoryCell: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   splitAmount: {
//     fontSize: 10,
//     color: '#666',
//   },
// });

// interface ReconciliationPDFProps {
//   month: string;
//   opening_balance: number;
//   closing_balance: number;
//   total_income: number;
//   total_expenses: number;
//   opening_date: string;
//   closing_date: string;
//   is_reconciled: boolean;
//   transactions: TreasuryTransaction[];
// }

// export default function ReconciliationPDF({
//   month,
//   opening_balance,
//   closing_balance,
//   total_income,
//   total_expenses,
//   opening_date,
//   closing_date,
//   is_reconciled,
//   transactions,
// }: ReconciliationPDFProps) {
//   const monthDisplay = new Date(month).toLocaleDateString('en-GB', {
//     month: 'long',
//     year: 'numeric',
//   });

//   return (
//     <Document>
//       <Page size="A4" style={styles.page}>
//         <View style={styles.header}>
//           <Text style={styles.title}>Bank Reconciliation Report</Text>
//           <Text style={styles.subtitle}>{monthDisplay}</Text>
//           <View style={styles.statusWrapper}>
//             <Text style={styles.status}>
//               {is_reconciled ? 'Reconciled' : 'Pending'}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.summarySection}>
//           <View style={styles.summaryRow}>
//             <View style={styles.summaryColumn}>
//               <Text style={styles.summaryLabel}>Opening Balance</Text>
//               <Text style={styles.summaryValue}>
//                 £{opening_balance.toFixed(2)}
//               </Text>
//               <Text style={styles.summaryDate}>
//                 {new Date(opening_date).toLocaleDateString()}
//               </Text>
//             </View>
//             <View style={styles.summaryColumn}>
//               <Text style={styles.summaryLabel}>Closing Balance</Text>
//               <Text style={styles.summaryValue}>
//                 £{closing_balance.toFixed(2)}
//               </Text>
//               <Text style={styles.summaryDate}>
//                 {new Date(closing_date).toLocaleDateString()}
//               </Text>
//             </View>
//             <View style={styles.summaryColumn}>
//               <Text style={styles.summaryLabel}>Total Income</Text>
//               <Text style={[styles.summaryValue, styles.income]}>
//                 £{total_income.toFixed(2)}
//               </Text>
//               <Text style={styles.summarySubtext}>↑Receipts</Text>
//             </View>
//             <View style={styles.summaryColumn}>
//               <Text style={styles.summaryLabel}>Total Expenses</Text>
//               <Text style={[styles.summaryValue, styles.expense]}>
//                 £{total_expenses.toFixed(2)}
//               </Text>
//               <Text style={styles.summarySubtext}>↓Payments</Text>
//             </View>
//           </View>
//         </View>

//         <View style={styles.separator} />

//         <Text style={styles.transactionsTitle}>Transaction Details</Text>

//         <View style={styles.table}>
//           <View style={styles.tableHeader}>
//             <Text style={[styles.tableHeaderCell, styles.col1]}>Date</Text>
//             <Text style={[styles.tableHeaderCell, styles.col2]}>
//               Description
//             </Text>
//             <Text style={[styles.tableHeaderCell, styles.col3]}>Type</Text>
//             <Text style={[styles.tableHeaderCell, styles.col4]}>Category</Text>
//             <Text style={[styles.tableHeaderCell, styles.col5]}>Splits</Text>
//             <Text style={[styles.tableHeaderCell, styles.col6]}>Amount</Text>
//           </View>

//           {transactions
//             .sort(
//               (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
//             )
//             .map((tx) => {
//               const isExpense = tx.splits.some((s) => s.category?.is_expense);
//               return (
//                 <View key={tx.id} style={styles.tableRow}>
//                   <Text style={[styles.tableCell, styles.col1]}>
//                     {new Date(tx.date).toLocaleDateString()}
//                   </Text>
//                   <Text style={[styles.tableCell, styles.col2]}>
//                     {tx.paid_to}
//                   </Text>
//                   <Text
//                     style={[
//                       styles.tableCell,
//                       styles.col3,
//                       isExpense ? styles.expense : styles.income,
//                     ]}
//                   >
//                     {isExpense ? 'Payment' : 'Receipt'}
//                   </Text>
//                   <View style={[styles.col4]}>
//                     {tx.splits.map((split) => (
//                       <Text key={split.id} style={styles.tableCell}>
//                         {split.category?.name}
//                       </Text>
//                     ))}
//                   </View>
//                   <View style={[styles.col5]}>
//                     {tx.splits.length > 1 &&
//                       tx.splits.map((split) => (
//                         <Text key={split.id} style={styles.tableCell}>
//                           £{split.amount.toFixed(2)}
//                         </Text>
//                       ))}
//                   </View>
//                   <Text
//                     style={[
//                       styles.tableCell,
//                       styles.col6,
//                       isExpense ? styles.expense : styles.income,
//                     ]}
//                   >
//                     {isExpense ? '-' : '+'}£{tx.total_amount.toFixed(2)}
//                   </Text>
//                 </View>
//               );
//             })}
//         </View>
//       </Page>
//     </Document>
//   );
// }
