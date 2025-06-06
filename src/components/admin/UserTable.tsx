
"use client";

import type { User, MockPurchase, UserMembership } from '@/types/user';
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle } from 'lucide-react';
import { AddPurchaseDialog } from './AddPurchaseDialog';

interface UserTableProps {
  users: User[];
  onUserUpdate: () => void;
  businessId: string; // ID of the business this admin is managing
}

export function UserTable({ users, onUserUpdate, businessId }: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddPurchaseDialogOpen, setIsAddPurchaseDialogOpen] = useState(false);

  if (!users || users.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No users enrolled in this business found.</p>;
  }

  const handleOpenAddPurchaseDialog = (user: User) => {
    setSelectedUser(user);
    setIsAddPurchaseDialogOpen(true);
  };

  const handlePurchaseAdded = () => {
    onUserUpdate();
  };

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
              <TableHead className="text-right">Points (in this Business)</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const membership = user.memberships?.find(m => m.businessId === businessId);
              const purchasesInBusiness = membership?.purchases || [];

              return (
                <React.Fragment key={user.id}>
                  <TableRow>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-right">
                      {membership?.pointsBalance || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenAddPurchaseDialog(user)}
                        className="text-primary border-primary hover:bg-primary/10 hover:text-primary"
                        disabled={!membership} // Disable if user isn't technically a member (should not happen with current filtering)
                      >
                        <PlusCircle className="mr-1 h-4 w-4" /> Add Purchase
                      </Button>
                    </TableCell>
                  </TableRow>
                  {purchasesInBusiness.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value={`item-${user.id}-${businessId}`}>
                            <AccordionTrigger className="text-sm py-2 hover:no-underline text-muted-foreground hover:text-primary">
                              View Purchases ({purchasesInBusiness.length}) for this Business
                            </AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Points Earned</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {purchasesInBusiness.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((purchase) => (
                                    <TableRow key={purchase.id}>
                                      <TableCell>{format(new Date(purchase.date), 'PPpp')}</TableCell>
                                      <TableCell>{purchase.item}</TableCell>
                                      <TableCell className="text-right">${purchase.amount.toFixed(2)}</TableCell>
                                      <TableCell className="text-right">
                                        <Badge variant={purchase.pointsEarned >= 0 ? "default" : "destructive"} className={purchase.pointsEarned > 0 ? "bg-green-500 hover:bg-green-600" : purchase.pointsEarned < 0 ? "bg-red-500 hover:bg-red-600" : ""}>
                                          {purchase.pointsEarned > 0 ? `+${purchase.pointsEarned}` : purchase.pointsEarned}
                                        </Badge>
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
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </ScrollArea>
      {selectedUser && businessId && (
        <AddPurchaseDialog
          user={selectedUser}
          businessId={businessId} // Pass the current business ID
          isOpen={isAddPurchaseDialogOpen}
          onOpenChange={setIsAddPurchaseDialogOpen}
          onPurchaseAdded={handlePurchaseAdded}
        />
      )}
    </>
  );
}
