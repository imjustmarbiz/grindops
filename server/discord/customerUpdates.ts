import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from "discord.js";
import { getDiscordBotClient } from "./bot";
import { storage } from "../storage";

export type CustomerUpdateType =
  | "progress"
  | "deadline_change"
  | "order_started"
  | "order_completed"
  | "issue_reported"
  | "login"
  | "logoff"
  | "proof_uploaded"
  | "grinder_replaced"
  | "order_assigned";

const UPDATE_CONFIG: Record<CustomerUpdateType, { color: number; emoji: string; title: string }> = {
  progress: { color: 0x3B82F6, emoji: "📋", title: "Order Progress Update" },
  deadline_change: { color: 0xF59E0B, emoji: "📅", title: "Deadline Update" },
  order_started: { color: 0x10B981, emoji: "🚀", title: "Order Started" },
  order_completed: { color: 0x22C55E, emoji: "✅", title: "Order Completed" },
  issue_reported: { color: 0xEF4444, emoji: "⚠️", title: "Issue Reported" },
  login: { color: 0x6366F1, emoji: "🟢", title: "Grinder Online" },
  logoff: { color: 0x6B7280, emoji: "🔴", title: "Grinder Offline" },
  proof_uploaded: { color: 0x8B5CF6, emoji: "📸", title: "Proof Submitted" },
  grinder_replaced: { color: 0xF97316, emoji: "🔄", title: "Grinder Reassigned" },
  order_assigned: { color: 0x06B6D4, emoji: "📌", title: "Order Assigned" },
};

async function isCustomerUpdatesEnabled(): Promise<boolean> {
  try {
    const config = await storage.getQueueConfig();
    return config?.customerUpdatesEnabled !== false;
  } catch {
    return true;
  }
}

function getActiveGrinderId(assignment: any): string {
  if (assignment.wasReassigned && assignment.replacementGrinderId) {
    return assignment.replacementGrinderId;
  }
  return assignment.grinderId;
}

export async function sendCustomerUpdate(options: {
  orderId: string;
  updateType: CustomerUpdateType;
  message: string;
  proofUrls?: string[];
  grinderName?: string;
  assignmentId?: string;
}): Promise<boolean> {
  const { orderId, updateType, message, proofUrls, grinderName } = options;

  try {
    if (!(await isCustomerUpdatesEnabled())) {
      console.log(`[customer-updates] Updates disabled, skipping ${updateType} for ${orderId}`);
      return false;
    }

    const client = getDiscordBotClient();
    if (!client) {
      console.log("[customer-updates] Bot not available, skipping");
      return false;
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      console.log(`[customer-updates] Order ${orderId} not found`);
      return false;
    }

    const channelId = order.discordTicketChannelId;
    if (!channelId) {
      console.log(`[customer-updates] No ticket channel for order ${orderId}`);
      return false;
    }

    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !(channel instanceof TextChannel)) {
      console.log(`[customer-updates] Channel ${channelId} not accessible`);
      return false;
    }

    const config = UPDATE_CONFIG[updateType] || UPDATE_CONFIG.progress;
    const customerMention = order.customerDiscordId ? `<@${order.customerDiscordId}>` : "";

    let resolvedGrinderName = grinderName;
    if (!resolvedGrinderName && options.assignmentId) {
      const assignment = await storage.getAssignment(options.assignmentId);
      if (assignment) {
        const activeId = getActiveGrinderId(assignment);
        const grinder = await storage.getGrinder(activeId);
        resolvedGrinderName = grinder?.name || "Your Grinder";
      }
    }
    if (!resolvedGrinderName) resolvedGrinderName = "Your Grinder";

    const services = await storage.getServices();
    const service = services.find((s: any) => s.id === order.serviceId);
    const serviceName = service?.name || "Service";

    const embed = new EmbedBuilder()
      .setColor(config.color)
      .setTitle(`${config.emoji} ${config.title}`)
      .setDescription(message)
      .addFields(
        { name: "Order", value: order.mgtOrderNumber ? `MGT-${order.mgtOrderNumber}` : order.id, inline: true },
        { name: "Service", value: serviceName, inline: true },
        { name: "Grinder", value: resolvedGrinderName, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: "SP Grinder Queue" });

    if (proofUrls && proofUrls.length > 0) {
      const proofList = proofUrls.map((url, i) => `[Proof ${i + 1}](${url})`).join(" | ");
      embed.addFields({ name: "📎 Attached Proof", value: proofList });
      if (proofUrls[0].match(/\.(png|jpg|jpeg|gif|webp)(\?|$)/i)) {
        embed.setImage(proofUrls[0]);
      }
    }

    if (order.orderDueDate) {
      embed.addFields({ name: "Deadline", value: new Date(order.orderDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), inline: true });
    }

    const content = customerMention ? `${customerMention} — Here's an update on your order:` : undefined;

    await channel.send({ content, embeds: [embed] });
    console.log(`[customer-updates] Sent ${updateType} update to channel ${channelId} for order ${orderId}`);
    return true;
  } catch (err: any) {
    console.error(`[customer-updates] Error sending ${updateType} for ${orderId}:`, err.message);
    return false;
  }
}

export async function sendCompletionApprovalRequest(options: {
  orderId: string;
  assignmentId: string;
  completionProofUrl?: string;
  proofUrls?: string[];
  grinderName?: string;
}): Promise<boolean> {
  const { orderId, assignmentId, completionProofUrl, proofUrls, grinderName } = options;

  try {
    if (!(await isCustomerUpdatesEnabled())) return false;

    const client = getDiscordBotClient();
    if (!client) return false;

    const order = await storage.getOrder(orderId);
    if (!order?.discordTicketChannelId) return false;

    const channel = await client.channels.fetch(order.discordTicketChannelId).catch(() => null);
    if (!channel || !(channel instanceof TextChannel)) return false;

    const token = `approve-${assignmentId}-${Date.now().toString(36)}`;
    await storage.updateAssignment(assignmentId, { customerApprovalToken: token });

    const customerMention = order.customerDiscordId ? `<@${order.customerDiscordId}>` : "";

    const services = await storage.getServices();
    const service = services.find((s: any) => s.id === order.serviceId);

    const embed = new EmbedBuilder()
      .setColor(0x22C55E)
      .setTitle("✅ Order Completed — Approval Required")
      .setDescription(
        `Your order has been completed by **${grinderName || "your grinder"}**!\n\n` +
        `Please review the proof below and click **Approve** to confirm the work is satisfactory.\n\n` +
        `If you have any concerns, please reach out to staff in this channel.`
      )
      .addFields(
        { name: "Order", value: order.mgtOrderNumber ? `MGT-${order.mgtOrderNumber}` : order.id, inline: true },
        { name: "Service", value: service?.name || "Service", inline: true },
      )
      .setTimestamp()
      .setFooter({ text: "SP Grinder Queue" });

    const allProofs = [
      ...(completionProofUrl ? [completionProofUrl] : []),
      ...(proofUrls || []),
    ].filter(Boolean);

    if (allProofs.length > 0) {
      const proofList = allProofs.map((url, i) => `[Proof ${i + 1}](${url})`).join(" | ");
      embed.addFields({ name: "📎 Completion Proof", value: proofList });
      if (allProofs[0].match(/\.(png|jpg|jpeg|gif|webp)(\?|$)/i)) {
        embed.setImage(allProofs[0]);
      }
    }

    const approveButton = new ButtonBuilder()
      .setCustomId(`customer_approve:${token}`)
      .setLabel("✅ Approve Completion")
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(approveButton);

    const content = customerMention
      ? `${customerMention} — Your order is ready for review!`
      : "Your order is ready for review!";

    await channel.send({ content, embeds: [embed], components: [row] });
    console.log(`[customer-updates] Sent approval request to channel ${order.discordTicketChannelId} for assignment ${assignmentId}`);
    return true;
  } catch (err: any) {
    console.error(`[customer-updates] Error sending approval request for ${assignmentId}:`, err.message);
    return false;
  }
}

export async function handleCustomerApprovalButton(token: string, customerDiscordId: string): Promise<{ success: boolean; orderId?: string; message: string }> {
  try {
    const allAssignments = await storage.getAssignments();
    const assignment = allAssignments.find((a: any) => a.customerApprovalToken === token);
    if (!assignment) {
      return { success: false, message: "This approval link is no longer valid." };
    }

    if (assignment.customerApproved) {
      return { success: false, message: "This order has already been approved." };
    }

    const order = await storage.getOrder(assignment.orderId);
    if (order?.customerDiscordId && order.customerDiscordId !== customerDiscordId) {
      return { success: false, message: "Only the order's customer can approve this completion." };
    }

    await storage.updateAssignment(assignment.id, {
      customerApproved: true,
      customerApprovedAt: new Date(),
    });

    const activeGrinderId = getActiveGrinderId(assignment);
    const existingPayouts = await storage.getPayoutRequests();
    const hasExisting = existingPayouts.some((p: any) => p.assignmentId === assignment.id);

    if (!hasExisting) {
      const earnings = Number(assignment.grinderEarnings) || Number(assignment.bidAmount) || 0;
      if (earnings > 0) {
        const grinder = await storage.getGrinder(activeGrinderId);
        const payoutMethods = grinder ? await storage.getGrinderPayoutMethods(grinder.id) : [];
        const defaultMethod = payoutMethods.find((m: any) => m.isDefault) || payoutMethods[0];

        await storage.createPayoutRequest({
          id: `PR-${Date.now().toString(36)}`,
          assignmentId: assignment.id,
          orderId: assignment.orderId,
          grinderId: activeGrinderId,
          amount: earnings.toString(),
          payoutPlatform: defaultMethod?.platform || null,
          payoutDetails: defaultMethod?.details || null,
          status: "Pending",
          completionProofUrl: (assignment as any).completionProofUrl || null,
        });

        console.log(`[customer-updates] Auto-created payout request after customer approval for ${assignment.id}`);
      }
    }

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "assignment",
      entityId: assignment.id,
      action: "customer_approved",
      actor: customerDiscordId,
      details: JSON.stringify({ orderId: assignment.orderId }),
    });

    return { success: true, orderId: assignment.orderId, message: "Order completion approved! The grinder's payout has been submitted for processing." };
  } catch (err: any) {
    console.error("[customer-updates] Error handling approval:", err.message);
    return { success: false, message: "An error occurred while processing your approval." };
  }
}
