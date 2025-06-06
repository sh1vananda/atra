
"use client";

import type { User } from '@/types/user';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserTableProps {
  users: User[];
}

export function UserTable({ users }: UserTableProps) {
  if (!users || users.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No users found.</p>;
  }

  return (
    <ScrollArea className="h-[600px] rounded-md border">
      <Table>
        <TableCaption>A list of your program's users and their recent activity.</TableCaption>
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow>
            <TableHead className="w-[100px]">User ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Total Points (Mock)</TableHead>
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
              </TableRow>
              {user.mockPurchases && user.mockPurchases.length > 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value={`item-${user.id}`}>
                        <AccordionTrigger className="text-sm py-2 hover:no-underline">View Mock Purchases ({user.mockPurchases.length})</AccordionTrigger>
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
                              {user.mockPurchases.map((purchase) => (
                                <TableRow key={purchase.id}>
                                  <TableCell>{format(new Date(purchase.date), 'PPpp')}</TableCell>
                                  <TableCell>{purchase.item}</TableCell>
                                  <TableCell className="text-right">${purchase.amount.toFixed(2)}</TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant={purchase.pointsEarned > 0 ? "default" : "destructive"} className={purchase.pointsEarned > 0 ? "bg-green-500 hover:bg-green-600" : ""}>
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
  );
}
