
"use client";

import type { PurchaseAppeal } from '@/types/appeal';
import { useState, useEffect, useCallback, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MessageSquare, User, Mail, CalendarDays, Coins, Hash, Loader2, AlertTriangle, Info } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { format, parseISO } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PurchaseAppealsSectionProps {
  businessId: string;
}

export function PurchaseAppealsSection({ businessId }: PurchaseAppealsSectionProps) {
  const { getPendingPurchaseAppeals, approvePurchaseAppeal, rejectPurchaseAppeal } = useAdminAuth();
  const [appeals, setAppeals] = useState<PurchaseAppeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, startProcessingTransition] = useTransition();
  const [selectedAppealForRejection, setSelectedAppealForRejection] = useState<PurchaseAppeal | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchAppeals = useCallback(async () => {
    setIsLoading(true);
    const pendingAppeals = await getPendingPurchaseAppeals(businessId);
    setAppeals(pendingAppeals);
    setIsLoading(false);
  }, [getPendingPurchaseAppeals, businessId]);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  const handleApprove = (appeal: PurchaseAppeal) => {
    startProcessingTransition(async () => {
      const success = await approvePurchaseAppeal(
        appeal.id, 
        appeal.pointsExpected,
        { item: appeal.item, amount: appeal.amount, userId: appeal.userId, businessId: appeal.businessId }
      );
      if (success) {
        fetchAppeals(); // Refresh list
      }
    });
  };

  const handleOpenRejectDialog = (appeal: PurchaseAppeal) => {
    setSelectedAppealForRejection(appeal);
    setRejectionReason(""); 
  };

  const handleReject = () => {
    if (!selectedAppealForRejection) return;
    startProcessingTransition(async () => {
      const success = await rejectPurchaseAppeal(
        selectedAppealForRejection.id, 
        rejectionReason || "No reason provided.",
        { item: selectedAppealForRejection.item, amount: selectedAppealForRejection.amount, userId: selectedAppealForRejection.userId, businessId: selectedAppealForRejection.businessId }
      );
      if (success) {
        fetchAppeals(); // Refresh list
        setSelectedAppealForRejection(null); // Close dialog
      }
    });
  };

  if (isLoading) {
    return (
      <Card className="mt-6 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Purchase Appeals</CardTitle>
          <CardDescription>Review and process point appeals from users.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pending appeals...</p>
        </CardContent>
      </Card>
    );
  }

  if (appeals.length === 0) {
    return (
      <Card className="mt-6 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Purchase Appeals</CardTitle>
          <CardDescription>Review and process point appeals from users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/30">
            <Info className="h-16 w-16 mx-auto text-primary mb-4 opacity-70" />
            <p className="text-xl font-semibold text-muted-foreground">No Pending Appeals</p>
            <p className="text-sm text-muted-foreground mt-1">There are currently no purchase appeals to review.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6 shadow-lg bg-card">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Purchase Appeals</CardTitle>
          <CardDescription>Review and process point appeals from users. ({appeals.length} pending)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Points Expected</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appeals.map((appeal) => (
                  <TableRow key={appeal.id}>
                    <TableCell>
                      <div className="font-medium">{appeal.userName}</div>
                      <div className="text-xs text-muted-foreground">{appeal.userEmail}</div>
                    </TableCell>
                    <TableCell>{appeal.item}</TableCell>
                    <TableCell className="text-right">${appeal.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{appeal.pointsExpected}</TableCell>
                    <TableCell className="max-w-xs truncate" title={appeal.appealReason}>
                        <MessageSquare className="inline h-4 w-4 mr-1 text-muted-foreground" />
                        {appeal.appealReason}
                    </TableCell>
                    <TableCell>
                      {appeal.submittedAt && typeof (appeal.submittedAt as any).toDate === 'function' 
                        ? format((appeal.submittedAt as any).toDate(), 'PPp')
                        : 'Date N/A'}
                    </TableCell>
                    <TableCell className="space-x-2 text-center">
                      <Button 
                        size="sm" 
                        variant="default" 
                        onClick={() => handleApprove(appeal)} 
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        aria-label={`Approve appeal from ${appeal.userName} for ${appeal.item}`}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4"/>}
                        <span className="ml-1 hidden sm:inline">Approve</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleOpenRejectDialog(appeal)} 
                        disabled={isProcessing}
                        aria-label={`Reject appeal from ${appeal.userName} for ${appeal.item}`}
                      >
                         {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4"/>}
                         <span className="ml-1 hidden sm:inline">Reject</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Review each appeal carefully before approving or rejecting.</TableCaption>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedAppealForRejection && (
        <Dialog open={!!selectedAppealForRejection} onOpenChange={(open) => !open && setSelectedAppealForRejection(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-destructive"/>
                Confirm Rejection
              </DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting the appeal for "{selectedAppealForRejection.item}" from {selectedAppealForRejection.userName}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason (Optional)</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Receipt not provided, purchase not verifiable."
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isProcessing}>Cancel</Button>
              </DialogClose>
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleReject} 
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Confirm Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
