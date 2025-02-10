import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/members/ui/card';

export const dynamic = 'force-dynamic';

export default function BudgetReportsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Budget Reports</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Summary Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$125,000</p>
            <p className="text-muted-foreground">Fiscal Year 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spent to Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$45,230</p>
            <p className="text-muted-foreground">36% of total budget</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$79,770</p>
            <p className="text-muted-foreground">64% remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports Table */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th className="px-6 py-3">Report Name</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      name: 'Q1 Financial Report',
                      date: '2024-03-31',
                      amount: '$15,750',
                      status: 'Completed',
                    },
                    {
                      name: 'February Budget Review',
                      date: '2024-02-29',
                      amount: '$12,250',
                      status: 'Pending',
                    },
                    {
                      name: 'January Summary',
                      date: '2024-01-31',
                      amount: '$17,230',
                      status: 'Completed',
                    },
                  ].map((report, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-6 py-4">{report.name}</td>
                      <td className="px-6 py-4">{report.date}</td>
                      <td className="px-6 py-4">{report.amount}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            report.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
