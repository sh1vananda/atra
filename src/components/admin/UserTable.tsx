
"use client";

import type { User } from '@/types/user';
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle } from 'lucide-react';
import { AddPurchaseDialog } from './AddPurchaseDialog'; // Import the new dialog

interface UserTableProps {
  users: User[];
  onUserUpdate: () => void; // Callback to refresh user list after an update
}

export function UserTable({ users, onUserUpdate }: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddPurchaseDialogOpen, setIsAddPurchaseDialogOpen] = useState(false);

  if (!users || users.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No users found.</p>;
  }

  const handleOpenAddPurchaseDialog = (user: User) => {
    setSelectedUser(user);
    setIsAddPurchaseDialogOpen(true);
  };

  const handlePurchaseAdded = () => {
    onUserUpdate(); // Call the refresh callback
    // selectedUser might need an update if its data changed, or re-fetch users
  };

  return (
    <>
      <ScrollArea className="h-[600px] rounded-md border">
        <Table>
          <TableCaption>A list of your program's users and their recent activity.</TableCaption>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead className="w-[100px]">User ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Total Points (Mock)</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <React.Fragment key={user.id}>
                <TableRow>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-right">
                    {user.mockPurchases?.reduce((sum, p) => sum + p.pointsEarned, 0) || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenAddPurchaseDialog(user)}
                      className="text-primary border-primary hover:bg-primary/10 hover:text-primary"
                    >
                      <PlusCircle className="mr-1 h-4 w-4" /> Add Purchase
                    </Button>
                  </TableCell>
                </TableRow>
                {user.mockPurchases && user.mockPurchases.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={`item-${user.id}`}>
                          <AccordionTrigger className="text-sm py-2 hover:no-underline text-muted-foreground hover:text-primary">View Mock Purchases ({user.mockPurchases.length})</AccordionTrigger>
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
                                {user.mockPurchases.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((purchase) => (
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
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      {selectedUser && (
        <AddPurchaseDialog
          user={selectedUser}
          isOpen={isAddPurchaseDialogOpen}
          onOpenChange={setIsAddPurchaseDialogOpen}
          onPurchaseAdded={handlePurchaseAdded}
        />
      )}
    </>
  );
}
