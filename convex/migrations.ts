import { action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const getTasksWithBase64 = internalQuery(async (ctx) => {
  const tasks = await ctx.db.query("tasks").collect();
  return tasks.filter(t => {
    const hasAttachments = t.attachments?.some((a: string) => a.startsWith("data:"));
    const hasProofPhotos = t.proofPhotoUrls?.some((a: string) => a.startsWith("data:"));
    const hasProofPhoto = t.proofPhotoUrl?.startsWith("data:");
    return hasAttachments || hasProofPhotos || hasProofPhoto;
  });
});

export const getUpdatesWithBase64 = internalQuery(async (ctx) => {
  const updates = await ctx.db.query("taskUpdates").collect();
  return updates.filter(u => u.photoUrl?.startsWith("data:"));
});

export const updateTaskImages = internalMutation({
  args: {
    taskId: v.id("tasks"),
    attachments: v.optional(v.array(v.string())),
    proofPhotoUrls: v.optional(v.array(v.string())),
    proofPhotoUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    await ctx.db.patch(taskId, updates);
  }
});

export const updateTaskUpdateImage = internalMutation({
  args: {
    updateId: v.id("taskUpdates"),
    photoUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.updateId, { photoUrl: args.photoUrl });
  }
});

// Helper inside the action to upload base64 to Storage
async function uploadBase64(ctx: any, base64Url: string) {
  const [header, base64Data] = base64Url.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });

  const uploadUrl = await ctx.runMutation(api.files.generateUploadUrl);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": mimeType },
    body: blob,
  });
  
  if (!response.ok) throw new Error("Upload failed");
  const { storageId } = await response.json();
  return storageId;
}

export const runBase64Migration = action(async (ctx) => {
  console.log("Starting Base64 migration...");
  
  // 1. Tasks
  const tasks = await ctx.runQuery(internal.migrations.getTasksWithBase64);
  console.log(`Found ${tasks.length} tasks to migrate.`);
  
  for (const task of tasks) {
    const newAttachments = [];
    if (task.attachments) {
      for (const att of task.attachments) {
        if (att.startsWith("data:")) newAttachments.push(await uploadBase64(ctx, att));
        else newAttachments.push(att);
      }
    }
    
    const newProofPhotos = [];
    if (task.proofPhotoUrls) {
      for (const proof of task.proofPhotoUrls) {
        if (proof.startsWith("data:")) newProofPhotos.push(await uploadBase64(ctx, proof));
        else newProofPhotos.push(proof);
      }
    }
    
    let newProofPhotoUrl = task.proofPhotoUrl;
    if (newProofPhotoUrl?.startsWith("data:")) {
      newProofPhotoUrl = await uploadBase64(ctx, newProofPhotoUrl);
    }
    
    await ctx.runMutation(internal.migrations.updateTaskImages, {
      taskId: task._id,
      attachments: newAttachments.length ? newAttachments : undefined,
      proofPhotoUrls: newProofPhotos.length ? newProofPhotos : undefined,
      proofPhotoUrl: newProofPhotoUrl,
    });
  }

  // 2. Task Updates
  const updates = await ctx.runQuery(internal.migrations.getUpdatesWithBase64);
  console.log(`Found ${updates.length} updates to migrate.`);
  
  for (const update of updates) {
    if (update.photoUrl?.startsWith("data:")) {
      const storageId = await uploadBase64(ctx, update.photoUrl);
      await ctx.runMutation(internal.migrations.updateTaskUpdateImage, {
        updateId: update._id,
        photoUrl: storageId,
      });
    }
  }
  
  console.log("Migration completed successfully.");
  return "Migration completed successfully.";
});
