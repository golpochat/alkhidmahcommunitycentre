"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SerializedClass, SerializedRegistration } from "@/lib/classes";
import { EDUCATION_API_PATH } from "@/lib/constants";

export function AdminRegistrationsManager() {
  const [registrations, setRegistrations] = useState<SerializedRegistration[]>([]);
  const [classes, setClasses] = useState<SerializedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [classId, setClassId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (classId !== "all") params.set("classId", classId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [classId, from, to]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [registrationsResponse, classesResponse] = await Promise.all([
          fetch(`/api/admin/registrations${queryString ? `?${queryString}` : ""}`),
          fetch(EDUCATION_API_PATH),
        ]);

        if (registrationsResponse.ok) {
          const data = await registrationsResponse.json();
          setRegistrations(Array.isArray(data) ? data : []);
        }

        if (classesResponse.ok) {
          const data = await classesResponse.json();
          setClasses(Array.isArray(data) ? data : []);
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [queryString]);

  async function handleExport() {
    const response = await fetch(
      `/api/admin/registrations${queryString ? `?${queryString}` : ""}`,
      { method: "POST" }
    );

    if (!response.ok) return;

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "registrations.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Registrations</h1>
          <p className="mt-2 text-muted-foreground">
            View class registrations, filter records, and export reports.
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="border-gold text-gold">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={classId} onValueChange={(value) => setClassId(value ?? "all")}>
              <SelectTrigger>
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No registrations found.
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell className="font-medium">{registration.name}</TableCell>
                    <TableCell>{registration.email}</TableCell>
                    <TableCell>{registration.phone || "—"}</TableCell>
                    <TableCell>{registration.classTitle}</TableCell>
                    <TableCell>
                      {format(parseISO(registration.createdAt), "d MMM yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
