
"use client";

import type { User, MockPurchase, UserMembership } from '@/types/user';
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
// AddPurchaseDialog is no longer used here; admins approve/reject appeals.

interface UserTableProps {
  users: User[];
  onUserUpdate: () => void; // To refresh data if needed, e.g., after an appeal affects points
  businessId: string; 
}

export function UserTable({ users, onUserUpdate, businessId }: UserTableProps) {
  
  if (!users || users.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No users enrolled in this business found.</p>;
  }

  return (
    <>
      <ScrollArea className="h-[600px] rounded-md border">
        <Table>
          <TableCaption>A list of users enrolled in your business and their activity.</TableCaption>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-[100px]">User ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Points Balance</TableHead>
              {/* Actions column might be used for other things later, like view user details */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const membership = user.memberships?.find(m => m.businessId === businessId);
              const purchasesInBusiness = membership?.purchases || [];

              return (
                <React.Fragment key={user.id}>
                  <TableRow>
                    <TableCell className="font-medium">{user.id.slice(0,8)}...</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {membership?.pointsBalance || 0}
                    </TableCell>
                  </TableRow>
                  {purchasesInBusiness.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={4}> {/* Adjusted colSpan */}
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value={`item-${user.id}-${businessId}`}>
                            <AccordionTrigger className="text-sm py-2 hover:no-underline text-muted-foreground hover:text-primary">
                              View Purchases & Activity ({purchasesInBusiness.length}) for this Business
                            </AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Item/Activity</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Points</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {purchasesInBusiness.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((purchase) => (
                                    <TableRow key={purchase.id}>
                                      <TableCell>{format(new Date(purchase.date), 'PPp')}</TableCell>
                                      <TableCell>{purchase.item}</TableCell>
                                      <TableCell className="text-right">${purchase.amount.toFixed(2)}</TableCell>
                                      <TableCell className="text-right">
                                        <Badge variant={purchase.pointsEarned >= 0 ? "default" : "destructive"} className={purchase.pointsEarned > 0 ? "bg-green-100 text-green-700 border-green-300" : purchase.pointsEarned < 0 ? "bg-red-100 text-red-700 border-red-300" : "bg-muted"}>
                                          {purchase.pointsEarned > 0 ? `+${purchase.pointsEarned}` : purchase.pointsEarned}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {purchase.status ? (
                                          <Badge variant="outline" className={
                                            purchase.status === 'approved' ? 'border-green-500 text-green-600' :
                                            purchase.status === 'rejected' ? 'border-red-500 text-red-600' :
                                            purchase.status === 'pending' ? 'border-yellow-500 text-yellow-600' : ''
                                          }>
                                            {purchase.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                                            {purchase.status === 'rejected' && <AlertTriangle className="mr-1 h-3 w-3" />}
                                            {purchase.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                                            {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline">N/A</Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </TableCell>
                    </TableRow>
                  )}
                   {purchasesInBusiness.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-3">
                            No purchase history for this user with your business yet.
                        </TableCell>
                     </TableRow>
                   )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </ScrollArea>
      {/* AddPurchaseDialog is removed as admins now handle appeals, not direct purchase additions here */}
    </>
  );
}
