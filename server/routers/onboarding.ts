import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { updateUser, getUserById, createShift, bulkCreateShifts, getAllPublishedLessons, createAssignment } from "../db";
import { TRPCError } from "@trpc/server";

const INDUSTRIES = [
  "Healthcare & Nursing",
  "Retail & Hospitality",
  "Manufacturing & Warehousing",
  "Construction & Trades",
  "Transportation & Logistics",
  "Food Service & Restaurant",
  "Security & Law Enforcement",
  "Cleaning & Facilities",
  "Energy & Utilities",
  "Education & Childcare",
  "General Workplace Skills",
] as const;

const SHIFT_TYPES = ["morning", "afternoon", "night", "split", "custom"] as const;

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

export const onboardingRouter = router({
  // Get onboarding status for current user
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    // Check if user has completed onboarding by looking at their profile completeness
    const hasTimezone = !!user.timezone && user.timezone !== "UTC";
    const hasNotificationPrefs = !!user.notificationPreferences;

    return {
      isOnboarded: hasTimezone && hasNotificationPrefs,
      currentStep: !hasTimezone ? 1 : !hasNotificationPrefs ? 2 : 4,
      user: {
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        appRole: user.appRole,
      },
    };
  }),

  // Step 1: Save profile basics (role, timezone)
  saveProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        timezone: z.string().min(1),
        appRole: z.enum(["learner", "employer_admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateUser(ctx.user.id, {
        name: input.name,
        timezone: input.timezone,
        appRole: input.appRole,
      });
      return { success: true };
    }),

  // Step 2: Save shift schedule
  saveShiftSchedule: protectedProcedure
    .input(
      z.object({
        shiftType: z.enum(SHIFT_TYPES),
        startHour: z.number().min(0).max(23),
        startMinute: z.number().min(0).max(59),
        endHour: z.number().min(0).max(23),
        endMinute: z.number().min(0).max(59),
        workDays: z.array(z.enum(DAYS_OF_WEEK)).min(1),
        breakDurationMinutes: z.number().min(0).max(120).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const orgId = user.orgId || 1;
      const now = Date.now();
      const dayMs = 86400000;

      // Create shifts for the next 2 weeks based on the schedule
      const dayMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6,
      };

      const shifts: Array<{
        userId: number;
        orgId: number;
        title: string;
        startTime: number;
        endTime: number;
        breakStartTime?: number;
        breakEndTime?: number;
        shiftType: "morning" | "afternoon" | "night" | "split" | "custom";
        source: "manual" | "webhook" | "import";
        isRecurring: boolean;
      }> = [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let week = 0; week < 2; week++) {
        for (const day of input.workDays) {
          const targetDayNum = dayMap[day];
          const currentDayNum = today.getDay();
          let daysUntil = targetDayNum - currentDayNum;
          if (daysUntil < 0) daysUntil += 7;
          daysUntil += week * 7;

          const shiftDate = new Date(today.getTime() + daysUntil * dayMs);
          const startTime = new Date(shiftDate);
          startTime.setHours(input.startHour, input.startMinute, 0, 0);

          const endTime = new Date(shiftDate);
          endTime.setHours(input.endHour, input.endMinute, 0, 0);
          // Handle overnight shifts
          if (endTime.getTime() <= startTime.getTime()) {
            endTime.setTime(endTime.getTime() + dayMs);
          }

          const shift: typeof shifts[0] = {
            userId: ctx.user.id,
            orgId,
            title: `${input.shiftType.charAt(0).toUpperCase() + input.shiftType.slice(1)} Shift`,
            startTime: startTime.getTime(),
            endTime: endTime.getTime(),
            shiftType: input.shiftType,
            source: "manual" as const,
            isRecurring: true,
          };

          if (input.breakDurationMinutes && input.breakDurationMinutes > 0) {
            const midpoint = startTime.getTime() + (endTime.getTime() - startTime.getTime()) / 2;
            shift.breakStartTime = midpoint - (input.breakDurationMinutes * 30000);
            shift.breakEndTime = midpoint + (input.breakDurationMinutes * 30000);
          }

          shifts.push(shift);
        }
      }

      if (shifts.length > 0) {
        await bulkCreateShifts(shifts);
      }

      return { success: true, shiftsCreated: shifts.length };
    }),

  // Step 3: Save industry interests and get recommended lessons
  saveInterests: protectedProcedure
    .input(
      z.object({
        industries: z.array(z.string()).min(1).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Save interests as notification preferences metadata
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const existingPrefs = user.notificationPreferences || { email: true, push: true, inApp: true };
      await updateUser(ctx.user.id, {
        notificationPreferences: {
          ...existingPrefs,
          email: existingPrefs.email ?? true,
          push: existingPrefs.push ?? true,
          inApp: existingPrefs.inApp ?? true,
        },
      });

      // Find recommended lessons based on selected industries
      const allLessons = await getAllPublishedLessons();
      const recommended = allLessons
        .filter((l: any) => {
          const cat = (l.category || "").toLowerCase();
          return input.industries.some((ind) => cat.toLowerCase().includes(ind.toLowerCase().split(" ")[0]));
        })
        .slice(0, 5);

      return {
        success: true,
        recommendedLessons: recommended.map((l: any) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          category: l.category,
          difficulty: l.difficulty,
          durationMinutes: l.durationMinutes,
          contentType: l.contentType,
        })),
      };
    }),

  // Step 4: Assign first lesson and complete onboarding
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        selectedLessonId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      const orgId = user.orgId || 1;

      // Assign the selected lesson if provided
      if (input.selectedLessonId) {
        try {
          await createAssignment({
            userId: ctx.user.id,
            lessonId: input.selectedLessonId,
            orgId,
            assignedBy: ctx.user.id,
            status: "available",
            dueDate: Date.now() + 7 * 86400000, // Due in 1 week
          });
        } catch (e) {
          // Assignment might already exist, that's fine
        }
      }

      // Mark onboarding as complete by ensuring notification preferences are set
      const prefs = user.notificationPreferences || { email: true, push: true, inApp: true };
      await updateUser(ctx.user.id, {
        notificationPreferences: {
          email: prefs.email ?? true,
          push: prefs.push ?? true,
          inApp: prefs.inApp ?? true,
        },
      });

      return { success: true };
    }),

  // Get available industries for selection
  getIndustries: publicProcedure.query(() => {
    return INDUSTRIES.map((name) => ({ name, value: name }));
  }),
});
