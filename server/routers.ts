import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createEventSong,
  acceptEventInvite,
  createEventInvite,
  deleteEventSong,
  getEventWorkspace,
  isEventOwner,
  listEventInvites,
  listEventsForUser,
  recordActivity,
  updateEventSong,
} from "./db";
import { inspectVideoUrl } from "./videoMetadata";

const keySchema = z.string().max(12).nullable().optional();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  video: router({
    inspect: publicProcedure
      .input(z.object({ videoUrl: z.string().url() }))
      .mutation(({ input }) => inspectVideoUrl(input.videoUrl)),
  }),
  collaboration: router({
    listInvites: protectedProcedure
      .input(z.object({ eventId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        if (!(await isEventOwner(input.eventId, ctx.user.id))) throw new TRPCError({ code: "FORBIDDEN", message: "Only the event owner can manage invites." });
        return listEventInvites(input.eventId);
      }),
    invite: protectedProcedure
      .input(z.object({ eventId: z.number().int().positive(), email: z.string().email(), role: z.enum(["editor", "viewer"]).default("editor") }))
      .mutation(async ({ ctx, input }) => {
        if (!(await isEventOwner(input.eventId, ctx.user.id))) throw new TRPCError({ code: "FORBIDDEN", message: "Only the event owner can invite bandmates." });
        const email = input.email.trim().toLowerCase();
        const id = await createEventInvite({ eventId: input.eventId, email, role: input.role, invitedBy: ctx.user.id });
        return { id, email, status: "pending" as const };
      }),
    acceptInvite: protectedProcedure
      .input(z.object({ inviteId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user.email) return { accepted: false } as const;
        return { accepted: await acceptEventInvite(input.inviteId, ctx.user.id, ctx.user.email.trim().toLowerCase()) } as const;
      }),
  }),
  setlists: router({
    list: protectedProcedure.query(({ ctx }) => listEventsForUser(ctx.user.id)),
    workspace: protectedProcedure
      .input(z.object({ eventId: z.number().int().positive() }))
      .query(({ ctx, input }) => getEventWorkspace(input.eventId, ctx.user.id)),
    addSong: protectedProcedure
      .input(
        z.object({
          eventId: z.number().int().positive(),
          setName: z.enum(["Set A", "Set B", "Set C"]).default("Set A"),
          title: z.string().trim().min(1).max(180),
          artist: z.string().trim().max(160).nullable().optional(),
          videoUrl: z.string().url().nullable().optional(),
          sourceKey: keySchema,
          singerKey: keySchema,
          position: z.number().int().nonnegative().default(0),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createEventSong({
          ...input,
          artist: input.artist ?? null,
          videoUrl: input.videoUrl ?? null,
          sourceKey: input.sourceKey ?? null,
          singerKey: input.singerKey ?? null,
          keyStatus: input.sourceKey ? "detected" : "pending",
          createdBy: ctx.user.id,
          updatedBy: ctx.user.id,
        });
        await recordActivity({
          eventId: input.eventId,
          userId: ctx.user.id,
          action: "added_song",
          detail: input.title,
        });
        return { id };
      }),
    updateSong: protectedProcedure
      .input(
        z.object({
          eventId: z.number().int().positive(),
          songId: z.number().int().positive(),
          setName: z.enum(["Set A", "Set B", "Set C"]).optional(),
          title: z.string().trim().min(1).max(180).optional(),
          artist: z.string().trim().max(160).nullable().optional(),
          videoUrl: z.string().url().nullable().optional(),
          sourceKey: keySchema,
          singerKey: keySchema,
          position: z.number().int().nonnegative().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { eventId, songId, ...values } = input;
        await updateEventSong(songId, eventId, { ...values, updatedBy: ctx.user.id });
        await recordActivity({
          eventId,
          userId: ctx.user.id,
          action: "updated_song",
          detail: input.title ?? undefined,
        });
        return { success: true } as const;
      }),
    removeSong: protectedProcedure
      .input(z.object({ eventId: z.number().int().positive(), songId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await deleteEventSong(input.songId, input.eventId);
        await recordActivity({
          eventId: input.eventId,
          userId: ctx.user.id,
          action: "removed_song",
          detail: String(input.songId),
        });
        return { success: true } as const;
      }),
    analyzeSourceKey: protectedProcedure
      .input(z.object({ videoUrl: z.string().url() }))
      .mutation(async () => {
        // Audio/video analysis is intentionally isolated behind this procedure. The
        // workbench can display a detected source key now and the provider can be
        // swapped in without changing the song editor contract.
        return { sourceKey: null, status: "pending" as const };
      }),
  }),
});

export type AppRouter = typeof appRouter;
