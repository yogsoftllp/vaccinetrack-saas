import React, { useState, useEffect } from 'react';
import { useFeatureFlag } from '../components/FeatureFlag';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Bell, Calendar, Mail, Phone, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface VaccinationReminder {
  id: string;
  patient_id: string;
  patient_name: string;
  vaccine_name: string;
  due_date: string;
  reminder_type: 'email' | 'sms' | 'push';
  status: 'pending' | 'sent' | 'failed';
  sent_at?: string;
  error_message?: string;
}

export const VaccinationReminders: React.FC = () => {
  const { isEnabled: vaccinationManagementEnabled } = useFeatureFlag('vaccination_management');
  const { isEnabled: appointmentRemindersEnabled } = useFeatureFlag('appointment_reminders');
  
  const [reminders, setReminders] = useState<VaccinationReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');

  useEffect(() => {
    if (vaccinationManagementEnabled && appointmentRemindersEnabled) {
      loadReminders();
    } else {
      setLoading(false);
    }
  }, [vaccinationManagementEnabled, appointmentRemindersEnabled]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vaccinations/reminders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }

      const data = await response.json();
      setReminders(data.reminders || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      toast.error('Failed to load vaccination reminders');
    } finally {
      setLoading(false);
    }
  };

  const sendManualReminder = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/vaccinations/reminders/${reminderId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }

      toast.success('Reminder sent successfully');
      loadReminders(); // Refresh the list
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReminderTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'push':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const filteredReminders = reminders.filter(reminder => 
    filter === 'all' || reminder.status === filter
  );

  if (!vaccinationManagementEnabled || !appointmentRemindersEnabled) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature Not Available</CardTitle>
            <CardDescription>
              Vaccination reminders are not available for your subscription plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <p>Please upgrade your subscription to access this feature.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vaccination Reminders</h1>
          <p className="text-muted-foreground">
            Manage and track vaccination reminders for patients
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reminders</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reminders.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {reminders.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reminders.filter(r => r.status === 'sent').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reminders.filter(r => r.status === 'failed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {['all', 'pending', 'sent', 'failed'].map((statusFilter) => (
              <Button
                key={statusFilter}
                variant={filter === statusFilter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(statusFilter as any)}
              >
                {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reminders List */}
      <Card>
        <CardHeader>
          <CardTitle>Reminder List</CardTitle>
          <CardDescription>
            {filteredReminders.length} {filter === 'all' ? '' : filter} reminder{filteredReminders.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{reminder.patient_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {reminder.vaccine_name} - Due: {new Date(reminder.due_date).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getReminderTypeIcon(reminder.reminder_type)}
                        {reminder.reminder_type.toUpperCase()}
                      </div>
                      {reminder.sent_at && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Sent: {new Date(reminder.sent_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getStatusBadgeColor(reminder.status)}>
                    {reminder.status.toUpperCase()}
                  </Badge>
                  
                  {reminder.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => sendManualReminder(reminder.id)}
                    >
                      Send Now
                    </Button>
                  )}
                  
                  {reminder.status === 'failed' && reminder.error_message && (
                    <div className="text-xs text-red-600 max-w-xs">
                      {reminder.error_message}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {filteredReminders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reminders found</p>
                <p className="text-sm">
                  {filter === 'all' ? 'No vaccination reminders have been created yet.' : `No ${filter} reminders found.`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VaccinationReminders;