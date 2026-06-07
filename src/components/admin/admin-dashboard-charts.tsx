"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DonationCategoryPoint,
  DonationProviderPoint,
  DonationTrendPoint,
  EventCategoryPoint,
  RegistrationByClassPoint,
} from "@/lib/admin-analytics";

const CHART_COLORS = ["#D4AF37", "#047857", "#1F2937", "#B8941F", "#059669", "#374151"];

interface AdminDashboardChartsProps {
  donationTrend: DonationTrendPoint[];
  registrationsByClass: RegistrationByClassPoint[];
  eventsByCategory: EventCategoryPoint[];
  donationsByCategory: DonationCategoryPoint[];
  donationsByProvider: DonationProviderPoint[];
}

export function AdminDashboardCharts({
  donationTrend,
  registrationsByClass,
  eventsByCategory,
  donationsByCategory,
  donationsByProvider,
}: AdminDashboardChartsProps) {
  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Donations Over Time</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={donationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#37415120" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#D4AF37"
                strokeWidth={2}
                dot={{ fill: "#D4AF37" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Registrations by Class</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={registrationsByClass}>
              <CartesianGrid strokeDasharray="3 3" stroke="#37415120" />
              <XAxis dataKey="className" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#047857" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Donations by Category</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={donationsByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#37415120" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="amount" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Donations by Provider</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donationsByProvider}
                dataKey="amount"
                nameKey="provider"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: €${value}`}
              >
                {donationsByProvider.map((entry, index) => (
                  <Cell
                    key={entry.provider}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Events by Category</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={eventsByCategory}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {eventsByCategory.map((entry, index) => (
                  <Cell
                    key={entry.category}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
