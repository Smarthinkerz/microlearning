/**
 * HRIS/WFM Integration Router
 * 
 * Provides endpoints for managing HRIS connections and triggering roster syncs.
 */
import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import {
  testHRISConnection,
  syncEmployees,
  parseEmployeeCSV,
  type HRISConfig,
  type HRISProvider,
} from "../services/hrisConnector";

const hrisConfigSchema = z.object({
  provider: z.enum(["workday", "sap_successfactors", "bamboohr", "csv_import"]),
  apiUrl: z.string().url().or(z.literal("")),
  apiKey: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  tenantId: z.string().optional(),
  syncInterval: z.number().min(15).max(1440).optional(),
  fieldMapping: z.record(z.string(), z.string()).optional(),
});

export const hrisRouter = router({
  /**
   * Test connection to an HRIS provider.
   */
  testConnection: adminProcedure
    .input(hrisConfigSchema)
    .mutation(async ({ input }) => {
      return testHRISConnection(input as HRISConfig);
    }),

  /**
   * Trigger a manual roster sync from HRIS.
   */
  syncRoster: adminProcedure
    .input(z.object({
      config: hrisConfigSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = (ctx.user as any).orgId;
      if (!orgId) throw new Error("No organization found");
      return syncEmployees(orgId, input.config as HRISConfig, ctx.user.id);
    }),

  /**
   * Import employees from CSV data.
   */
  importCSV: adminProcedure
    .input(z.object({
      csvContent: z.string().min(10),
    }))
    .mutation(async ({ input }) => {
      const employees = parseEmployeeCSV(input.csvContent);
      return {
        parsed: employees.length,
        employees: employees.slice(0, 10), // Preview first 10
        hasMore: employees.length > 10,
      };
    }),

  /**
   * Get available HRIS providers and their required fields.
   */
  getProviders: protectedProcedure.query(() => {
    return [
      {
        id: "workday" as HRISProvider,
        name: "Workday",
        requiredFields: ["apiUrl", "apiKey", "tenantId"],
        description: "Connect to Workday HCM for employee and schedule data",
        logo: "workday",
      },
      {
        id: "sap_successfactors" as HRISProvider,
        name: "SAP SuccessFactors",
        requiredFields: ["apiUrl", "clientId", "clientSecret"],
        description: "Connect to SAP SuccessFactors for employee management",
        logo: "sap",
      },
      {
        id: "bamboohr" as HRISProvider,
        name: "BambooHR",
        requiredFields: ["apiUrl", "apiKey", "tenantId"],
        description: "Connect to BambooHR for employee directory sync",
        logo: "bamboohr",
      },
      {
        id: "csv_import" as HRISProvider,
        name: "CSV Import",
        requiredFields: [],
        description: "Upload a CSV file with employee data",
        logo: "csv",
      },
    ];
  }),
});
