import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, Search, Filter, Calendar, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function EmailLogsDashboard() {
  const [searchEmail, setSearchEmail] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['emailLogs', searchEmail, filterType, filterStatus],
    queryFn: async () => {
      const response = await base44.functions.invoke('emailService', {
        action: 'get_email_logs',
        limit: 100
      });
      return response.data.logs || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const filteredLogs = (logs || []).filter(log => {
    if (searchEmail && !log.recipient.toLowerCase().includes(searchEmail.toLowerCase())) return false;
    if (filterType !== 'all' && log.email_type !== filterType) return false;
    if (filterStatus !== 'all' && log.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: logs?.length || 0,
    sent: logs?.filter(l => l.status === 'sent').length || 0,
    failed: logs?.filter(l => l.status === 'failed').length || 0,
    today: logs?.filter(l => new Date(l.sent_at).toDateString() === new Date().toDateString()).length || 0,
  };

  const emailTypes = [...new Set(logs?.map(l => l.email_type) || [])];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Mail className="w-8 h-8 text-primary" />
            Email Logs Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Track all emails sent through the platform</p>
        </div>
        <Button onClick={refetch} variant="outline" className="gap-2">
          <Clock className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-500">Sent Successfully</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-500">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-primary">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.today}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email address..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {emailTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Email Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Email Logs ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No email logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Recipient</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Subject</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Sent At</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-card/50">
                      <td className="py-3 px-4">
                        <Badge variant={log.status === 'sent' ? 'default' : 'destructive'} className="gap-1">
                          {log.status === 'sent' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">{log.email_type}</td>
                      <td className="py-3 px-4 text-sm">{log.recipient}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-xs">{log.subject}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(log.sent_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Email Details</DialogTitle>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Recipient</p>
                                    <p className="font-medium">{selectedLog.recipient}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Type</p>
                                    <p className="font-mono">{selectedLog.email_type}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Subject</p>
                                    <p className="font-medium">{selectedLog.subject}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Status</p>
                                    <Badge variant={selectedLog.status === 'sent' ? 'default' : 'destructive'}>
                                      {selectedLog.status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Sent At</p>
                                    <p className="font-medium">
                                      {new Date(selectedLog.sent_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">Metadata</p>
                                  <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-auto max-h-64">
                                    {JSON.stringify(selectedLog.metadata, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}