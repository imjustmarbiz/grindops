import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, type ChatInputCommandInteraction, Partials, type ButtonInteraction } from "discord.js";
import { storage } from "../storage";
import { handleNewOrderMessage, handleProposalMessage, handleMessageUpdate, handleRulesAcceptance, backfillMissedMessages, startProposalBidSync } from "./mgtWatcher";
import { GRINDER_ROLES, ROLE_LABELS } from "@shared/schema";
import { handleCustomerApprovalButton, handleCustomerIssueButton } from "./customerUpdates";

let client: Client | null = null;

export function getDiscordBotClient(): Client | null {
  return client;
}

const ROLE_LABEL_TO_ID: Record<string, string> = {};
for (const [id, label] of Object.entries(ROLE_LABELS)) {
  if (!ROLE_LABEL_TO_ID[label]) {
    ROLE_LABEL_TO_ID[label] = id;
  }
}

const ALL_SYNCABLE_ROLE_IDS = new Set(Object.values(GRINDER_ROLES));

export async function syncDiscordRoles(discordUserId: string, newRoles: string[]): Promise<boolean> {
  if (!client) {
    console.log("[discord-sync] Bot not available, skipping role sync");
    return false;
  }

  try {
    const guilds = client.guilds.cache;
    for (const [, guild] of guilds) {
      const member = await guild.members.fetch(discordUserId).catch(() => null);
      if (!member) continue;

      const currentRoleIds = Array.from(member.roles.cache.keys());
      const desiredRoleIds = new Set<string>();
      for (const roleName of newRoles) {
        const roleId = ROLE_LABEL_TO_ID[roleName];
        if (roleId) desiredRoleIds.add(roleId);
        if (roleName === "VC Grinder" && GRINDER_ROLES.VC_2) {
          desiredRoleIds.add(GRINDER_ROLES.VC_2);
        }
      }

      const rolesToAdd: string[] = [];
      const rolesToRemove: string[] = [];

      for (const roleId of desiredRoleIds) {
        if (!currentRoleIds.includes(roleId)) {
          rolesToAdd.push(roleId);
        }
      }

      for (const roleId of currentRoleIds) {
        if (ALL_SYNCABLE_ROLE_IDS.has(roleId) && !desiredRoleIds.has(roleId)) {
          rolesToRemove.push(roleId);
        }
      }

      if (rolesToAdd.length === 0 && rolesToRemove.length === 0) {
        console.log(`[discord-sync] No role changes needed for ${discordUserId}`);
        return true;
      }

      for (const roleId of rolesToAdd) {
        await member.roles.add(roleId).catch((e: any) => console.error(`[discord-sync] Failed to add role ${roleId}:`, e.message));
      }
      for (const roleId of rolesToRemove) {
        await member.roles.remove(roleId).catch((e: any) => console.error(`[discord-sync] Failed to remove role ${roleId}:`, e.message));
      }

      console.log(`[discord-sync] Synced roles for ${discordUserId}: +[${rolesToAdd.join(",")}] -[${rolesToRemove.join(",")}]`);
      return true;
    }
    console.log(`[discord-sync] Member ${discordUserId} not found in any guild`);
    return false;
  } catch (err: any) {
    console.error(`[discord-sync] Error syncing roles for ${discordUserId}:`, err.message);
    return false;
  }
}

const commands = [
  new SlashCommandBuilder()
    .setName("queue")
    .setDescription("View the top priority queue items"),

  new SlashCommandBuilder()
    .setName("dashboard")
    .setDescription("View dashboard stats overview"),

  new SlashCommandBuilder()
    .setName("orders")
    .setDescription("View all open orders"),

  new SlashCommandBuilder()
    .setName("grinders")
    .setDescription("View all grinders and their status"),

  new SlashCommandBuilder()
    .setName("bids")
    .setDescription("View all pending bids"),

  new SlashCommandBuilder()
    .setName("assignments")
    .setDescription("View all active assignments"),

  new SlashCommandBuilder()
    .setName("neworder")
    .setDescription("Create a new order")
    .addStringOption(opt =>
      opt.setName("service").setDescription("Service ID (e.g. S1)").setRequired(true))
    .addNumberOption(opt =>
      opt.setName("price").setDescription("Customer price").setRequired(true))
    .addIntegerOption(opt =>
      opt.setName("complexity").setDescription("Complexity 1-5").setRequired(true))
    .addBooleanOption(opt =>
      opt.setName("rush").setDescription("Is this a rush order?").setRequired(false)),

  new SlashCommandBuilder()
    .setName("setprice")
    .setDescription("Set or update the price on an order")
    .addStringOption(opt =>
      opt.setName("order").setDescription("Order ID (e.g. O-abc123 or MGT order number like 168)").setRequired(true))
    .addNumberOption(opt =>
      opt.setName("price").setDescription("New customer price").setRequired(true)),

  new SlashCommandBuilder()
    .setName("placebid")
    .setDescription("Place a bid on an order")
    .addStringOption(opt =>
      opt.setName("order").setDescription("Order ID (e.g. MGT-168)").setRequired(true))
    .addStringOption(opt =>
      opt.setName("grinder").setDescription("Grinder ID (e.g. GRD-01)").setRequired(true))
    .addNumberOption(opt =>
      opt.setName("amount").setDescription("Bid amount").setRequired(true))
    .addIntegerOption(opt =>
      opt.setName("delivery_days").setDescription("Estimated delivery in days").setRequired(true)),

  new SlashCommandBuilder()
    .setName("assign")
    .setDescription("Assign a grinder to an order")
    .addStringOption(opt =>
      opt.setName("order").setDescription("Order ID").setRequired(true))
    .addStringOption(opt =>
      opt.setName("grinder").setDescription("Grinder ID").setRequired(true)),

  new SlashCommandBuilder()
    .setName("requestupdate")
    .setDescription("Request an update on your order (customer command)")
    .addStringOption(opt =>
      opt.setName("order").setDescription("Order ID or MGT number (e.g. MGT-168)").setRequired(true)),

  new SlashCommandBuilder()
    .setName("orderstatus")
    .setDescription("Check the status of your order (customer command)")
    .addStringOption(opt =>
      opt.setName("order").setDescription("Order ID or MGT number (e.g. MGT-168)").setRequired(true)),

  new SlashCommandBuilder()
    .setName("myorders")
    .setDescription("View all your orders (customer command)"),

];

async function handleQueue(interaction: ChatInputCommandInteraction) {
  const items = await storage.getTopQueueItems();
  if (items.length === 0) {
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Priority Queue").setDescription("No items in queue.").setColor(0x5865F2)], ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Priority Queue - Top Items")
    .setColor(0x5865F2)
    .setTimestamp();

  for (const item of items.slice(0, 5)) {
    const margin = (Number(item.customerPrice) - Number(item.bidAmount)).toFixed(2);
    embed.addFields({
      name: `${item.orderId} - ${item.serviceName}`,
      value: `Grinder: **${item.grinderName}** (${item.tier})\nBid: $${item.bidAmount} | Price: $${item.customerPrice} | Margin: $${margin}\nScore: ${item.finalPriorityScore.toFixed(2)}`,
      inline: false,
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleDashboard(interaction: ChatInputCommandInteraction) {
  const stats = await storage.getDashboardStats();
  const allBids = await storage.getBids();
  const pendingBids = allBids.filter(b => b.status === "Pending").length;
  const acceptedBids = allBids.filter(b => b.status === "Accepted").length;

  const embed = new EmbedBuilder()
    .setTitle("Dashboard Overview")
    .setColor(0x57F287)
    .addFields(
      { name: "Active Orders", value: String(stats.activeOrders), inline: true },
      { name: "Completed", value: String(stats.completedToday), inline: true },
      { name: "Grinders", value: `${stats.availableGrinders} avail / ${stats.totalGrinders} total`, inline: true },
      { name: "Pending Bids", value: String(pendingBids), inline: true },
      { name: "Accepted Bids", value: String(acceptedBids), inline: true },
    )
    .setFooter({ text: "Data sourced from MGT Bot activity" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleOrders(interaction: ChatInputCommandInteraction) {
  const allOrders = await storage.getOrders();
  const services = await storage.getServices();
  const openOrders = allOrders.filter(o => o.status === "Open");

  if (openOrders.length === 0) {
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Open Orders").setDescription("No open orders.").setColor(0xFEE75C)], ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Open Orders (${openOrders.length})`)
    .setColor(0xFEE75C)
    .setTimestamp();

  for (const order of openOrders.slice(0, 10)) {
    const service = services.find(s => s.id === order.serviceId);
    const mgtRef = order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : order.id;
    const platformInfo = order.platform ? ` | ${order.platform}` : "";
    const gamertagInfo = order.gamertag ? `\nGamertag: ${order.gamertag}` : "";
    const rush = order.isRush ? " [RUSH]" : "";

    embed.addFields({
      name: `${mgtRef}${rush} - ${service?.name || order.serviceId}`,
      value: `Price: $${order.customerPrice}${platformInfo}${gamertagInfo}\nDue: ${order.orderDueDate ? new Date(order.orderDueDate).toLocaleDateString() : "N/A"}`,
      inline: true,
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleGrinders(interaction: ChatInputCommandInteraction) {
  const allGrinders = await storage.getGrinders();

  if (allGrinders.length === 0) {
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Grinders").setDescription("No grinders registered.").setColor(0xED4245)], ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Grinder Roster (${allGrinders.length})`)
    .setColor(0xEB459E)
    .setTimestamp();

  for (const g of allGrinders.slice(0, 10)) {
    const available = Number(g.activeOrders) < g.capacity;
    const statusLabel = available ? "[AVAILABLE]" : "[FULL]";
    const winRateStr = g.winRate ? `${(Number(g.winRate) * 100).toFixed(0)}%` : "N/A";
    const discordName = g.discordUsername ? ` (@${g.discordUsername})` : "";

    embed.addFields({
      name: `${statusLabel} ${g.name}${discordName}`,
      value: `Tier: ${g.tier} | Orders: ${g.totalOrders} | Win Rate: ${winRateStr}\nOrder Limit: ${g.activeOrders}/${g.capacity} | Strikes: ${g.strikes}`,
      inline: true,
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleBids(interaction: ChatInputCommandInteraction) {
  const allBids = await storage.getBids();
  const allGrinders = await storage.getGrinders();
  const pendingBids = allBids.filter(b => b.status === "Pending");

  if (pendingBids.length === 0) {
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Pending Bids").setDescription("No pending bids.").setColor(0x5865F2)], ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Pending Bids (${pendingBids.length})`)
    .setColor(0x5865F2)
    .setTimestamp();

  for (const b of pendingBids.slice(0, 10)) {
    const grinder = allGrinders.find(g => g.id === b.grinderId);
    const grinderName = grinder?.name || b.grinderId;
    const proposalRef = b.mgtProposalId ? `P${b.mgtProposalId}` : b.id;
    const timelineStr = b.timeline ? ` | ETA: ${b.timeline}` : "";
    const canStartStr = b.canStart ? ` | Start: ${b.canStart}` : "";
    const marginStr = b.margin ? `\nMargin: $${b.margin} (${b.marginPct}%)` : "";
    const qualityStr = b.qualityScore ? ` | QS: ${b.qualityScore}` : "";

    embed.addFields({
      name: `${proposalRef} - Order ${b.orderId}`,
      value: `Grinder: ${grinderName} | Bid: $${b.bidAmount}${timelineStr}${canStartStr}${marginStr}${qualityStr}`,
      inline: false,
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleAssignments(interaction: ChatInputCommandInteraction) {
  const allAssignments = await storage.getAssignments();
  const allGrinders = await storage.getGrinders();
  const active = allAssignments.filter(a => a.status === "Active");

  if (active.length === 0) {
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Active Assignments").setDescription("No active assignments.").setColor(0x57F287)], ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Active Assignments (${active.length})`)
    .setColor(0x57F287)
    .setTimestamp();

  for (const a of active.slice(0, 10)) {
    const grinder = allGrinders.find(g => g.id === a.grinderId);
    const grinderName = grinder?.name || a.grinderId;
    const marginStr = a.margin ? ` | Margin: $${a.margin} (${a.marginPct}%)` : "";

    embed.addFields({
      name: `${a.id} - Order ${a.orderId}`,
      value: `Grinder: ${grinderName}${marginStr}\nDue: ${a.dueDateTime ? new Date(a.dueDateTime).toLocaleDateString() : "N/A"}`,
      inline: true,
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleNewOrder(interaction: ChatInputCommandInteraction) {
  const serviceId = interaction.options.getString("service", true);
  const price = interaction.options.getNumber("price", true);
  const complexity = interaction.options.getInteger("complexity", true);
  const rush = interaction.options.getBoolean("rush") ?? false;

  try {
    const existingServices = await storage.getServices();
    const service = existingServices.find(s => s.id === serviceId);
    if (!service) {
      await interaction.reply({ content: `Service "${serviceId}" not found. Available: ${existingServices.map(s => `${s.id} (${s.name})`).join(", ")}`, ephemeral: true });
      return;
    }

    const orderId = `O${Date.now().toString(36).toUpperCase()}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + service.slaDays);

    const order = await storage.createOrder({
      id: orderId,
      serviceId,
      customerPrice: price.toFixed(2),
      orderDueDate: dueDate,
      isRush: rush,
      complexity,
      location: "Retail",
      status: "Open",
    });

    const embed = new EmbedBuilder()
      .setTitle("Order Created")
      .setColor(0x57F287)
      .addFields(
        { name: "Order ID", value: order.id, inline: true },
        { name: "Service", value: service.name, inline: true },
        { name: "Price", value: `$${order.customerPrice}`, inline: true },
        { name: "Complexity", value: `${order.complexity}/5`, inline: true },
        { name: "Rush", value: order.isRush ? "Yes" : "No", inline: true },
        { name: "Due", value: dueDate.toLocaleDateString(), inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error: any) {
    await interaction.reply({ content: `Failed to create order: ${error.message}`, ephemeral: true });
  }
}

async function handleSetPrice(interaction: ChatInputCommandInteraction) {
  const orderInput = interaction.options.getString("order", true);
  const price = interaction.options.getNumber("price", true);

  try {
    const allOrders = await storage.getOrders();
    let order = allOrders.find(o => o.id === orderInput);
    if (!order) {
      const mgtNum = parseInt(orderInput.replace(/\D/g, ""));
      if (!isNaN(mgtNum)) {
        order = allOrders.find(o => o.mgtOrderNumber === mgtNum);
      }
    }

    if (!order) {
      await interaction.reply({ content: `Order "${orderInput}" not found. Use the order ID or MGT order number.`, ephemeral: true });
      return;
    }

    const oldPrice = order.customerPrice;
    const updated = await storage.updateOrder(order.id, { customerPrice: price.toFixed(2) });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "order",
      entityId: order.id,
      action: "price_updated",
      actor: interaction.user.tag,
      details: JSON.stringify({ oldPrice, newPrice: price.toFixed(2) }),
    });

    const mgtRef = order.mgtOrderNumber ? `#${order.mgtOrderNumber}` : order.id;
    const embed = new EmbedBuilder()
      .setTitle("Order Price Updated")
      .setColor(0x57F287)
      .addFields(
        { name: "Order", value: mgtRef, inline: true },
        { name: "Old Price", value: `$${oldPrice}`, inline: true },
        { name: "New Price", value: `$${price.toFixed(2)}`, inline: true },
        { name: "Updated By", value: interaction.user.tag, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error: any) {
    await interaction.reply({ content: `Failed to update price: ${error.message}`, ephemeral: true });
  }
}

async function handlePlaceBid(interaction: ChatInputCommandInteraction) {
  const orderId = interaction.options.getString("order", true);
  const grinderId = interaction.options.getString("grinder", true);
  const amount = interaction.options.getNumber("amount", true);
  const deliveryDays = interaction.options.getInteger("delivery_days", true);

  try {
    const order = await storage.getOrder(orderId);
    if (!order) {
      await interaction.reply({ content: `Order "${orderId}" not found.`, ephemeral: true });
      return;
    }

    const grinder = await storage.getGrinder(grinderId);
    if (!grinder) {
      await interaction.reply({ content: `Grinder "${grinderId}" not found.`, ephemeral: true });
      return;
    }

    if (!grinder.rulesAccepted) {
      await interaction.reply({ content: `⚠️ Grinder "${grinder.name}" has not accepted the Grinder Rules yet. They must use \`/grinder rules\` from the MGT Bot to accept before placing bids.`, ephemeral: true });
      return;
    }

    if (grinder.suspended) {
      await interaction.reply({ content: `⚠️ Grinder "${grinder.name}" is currently suspended and cannot place bids.`, ephemeral: true });
      return;
    }

    const bidId = `B${Date.now().toString(36).toUpperCase()}`;
    const estDelivery = new Date();
    estDelivery.setDate(estDelivery.getDate() + deliveryDays);

    const bid = await storage.createBid({
      id: bidId,
      orderId,
      grinderId,
      bidAmount: amount.toFixed(2),
      estDeliveryDate: estDelivery,
      status: "Pending",
    });

    const embed = new EmbedBuilder()
      .setTitle("Bid Placed")
      .setColor(0x5865F2)
      .addFields(
        { name: "Bid ID", value: bid.id, inline: true },
        { name: "Order", value: bid.orderId, inline: true },
        { name: "Grinder", value: `${grinder.name} (${grinder.id})`, inline: true },
        { name: "Amount", value: `$${bid.bidAmount}`, inline: true },
        { name: "Est. Delivery", value: estDelivery.toLocaleDateString(), inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error: any) {
    await interaction.reply({ content: `Failed to place bid: ${error.message}`, ephemeral: true });
  }
}

async function handleAssign(interaction: ChatInputCommandInteraction) {
  const orderId = interaction.options.getString("order", true);
  const grinderId = interaction.options.getString("grinder", true);

  try {
    const order = await storage.getOrder(orderId);
    if (!order) {
      await interaction.reply({ content: `Order "${orderId}" not found.`, ephemeral: true });
      return;
    }

    const grinder = await storage.getGrinder(grinderId);
    if (!grinder) {
      await interaction.reply({ content: `Grinder "${grinderId}" not found.`, ephemeral: true });
      return;
    }

    if (Number(grinder.activeOrders) >= grinder.capacity) {
      await interaction.reply({ content: `Grinder "${grinder.name}" is at their order limit (${grinder.activeOrders}/${grinder.capacity}).`, ephemeral: true });
      return;
    }

    const assignmentId = `A${Date.now().toString(36).toUpperCase()}`;

    const assignment = await storage.createAssignment({
      id: assignmentId,
      grinderId,
      orderId,
      dueDateTime: order.orderDueDate,
      status: "Active",
    });

    await storage.updateOrderStatus(orderId, "Assigned");

    const embed = new EmbedBuilder()
      .setTitle("Assignment Created")
      .setColor(0x57F287)
      .addFields(
        { name: "Assignment ID", value: assignment.id, inline: true },
        { name: "Order", value: assignment.orderId, inline: true },
        { name: "Grinder", value: `${grinder.name} (${grinder.id})`, inline: true },
        { name: "Status", value: assignment.status, inline: true },
        { name: "Due", value: assignment.dueDateTime ? new Date(assignment.dueDateTime).toLocaleDateString() : "N/A", inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error: any) {
    await interaction.reply({ content: `Failed to create assignment: ${error.message}`, ephemeral: true });
  }
}

async function findOrderByInput(input: string) {
  const trimmed = input.trim();
  const mgtMatch = trimmed.match(/^(?:MGT[- ]?)?(\d+)$/i);
  if (mgtMatch) {
    const mgtNum = parseInt(mgtMatch[1]);
    const allOrders = await storage.getOrders();
    return allOrders.find((o: any) => o.mgtOrderNumber === mgtNum) || null;
  }
  return await storage.getOrder(trimmed);
}

async function handleRequestUpdate(interaction: ChatInputCommandInteraction) {
  const orderInput = interaction.options.getString("order", true);
  const customerDiscordId = interaction.user.id;

  try {
    const order = await findOrderByInput(orderInput);
    if (!order) {
      await interaction.reply({ content: "Order not found. Please check the order ID.", ephemeral: true });
      return;
    }

    if (order.customerDiscordId && order.customerDiscordId !== customerDiscordId) {
      await interaction.reply({ content: "You are not the customer for this order.", ephemeral: true });
      return;
    }

    if (!order.assignedGrinderId) {
      await interaction.reply({ content: "This order has not been assigned to a grinder yet.", ephemeral: true });
      return;
    }

    const allAssignments = await storage.getAssignments();
    const assignment = allAssignments.find((a: any) => a.orderId === order.id && a.status === "Active");
    const activeGrinderId = assignment
      ? (assignment.wasReassigned && assignment.replacementGrinderId ? assignment.replacementGrinderId : assignment.grinderId)
      : order.assignedGrinderId;

    await storage.createGrinderTask({
      id: `GT-${Date.now().toString(36)}`,
      grinderId: activeGrinderId,
      orderId: order.id,
      assignmentId: assignment?.id || null,
      title: `Customer Update Request — ${order.mgtOrderNumber ? `MGT-${order.mgtOrderNumber}` : order.id}`,
      description: `The customer has requested an update on this order via Discord. Please provide a progress update as soon as possible.`,
      type: "customer_request",
      status: "pending",
      priority: "urgent",
      createdBy: customerDiscordId,
      createdByName: interaction.user.username,
    });

    const embed = new EmbedBuilder()
      .setTitle("📋 Update Request Sent")
      .setColor(0x3B82F6)
      .setDescription(`Your update request has been sent to the grinder working on order **${order.mgtOrderNumber ? `MGT-${order.mgtOrderNumber}` : order.id}**.\n\nThey will be notified and should respond soon.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error: any) {
    await interaction.reply({ content: "Something went wrong processing your request.", ephemeral: true });
  }
}

async function handleOrderStatus(interaction: ChatInputCommandInteraction) {
  const orderInput = interaction.options.getString("order", true);
  const customerDiscordId = interaction.user.id;

  try {
    const order = await findOrderByInput(orderInput);
    if (!order) {
      await interaction.reply({ content: "Order not found. Please check the order ID.", ephemeral: true });
      return;
    }

    if (order.customerDiscordId && order.customerDiscordId !== customerDiscordId) {
      await interaction.reply({ content: "You are not the customer for this order.", ephemeral: true });
      return;
    }

    const services = await storage.getServices();
    const service = services.find((s: any) => s.id === order.serviceId);

    let grinderInfo = "Not yet assigned";
    const allAssignments = await storage.getAssignments();
    const assignment = allAssignments.find((a: any) => a.orderId === order.id && (a.status === "Active" || a.status === "Completed"));
    if (assignment) {
      const activeId = assignment.wasReassigned && assignment.replacementGrinderId ? assignment.replacementGrinderId : assignment.grinderId;
      const grinder = await storage.getGrinder(activeId);
      grinderInfo = grinder?.name || activeId;
    }

    let lastUpdate = "No updates yet";
    const updates = await storage.getOrderUpdates(order.id);
    if (updates.length > 0) {
      const latest = updates.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      lastUpdate = `${latest.message}\n*— ${new Date(latest.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}*`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`📦 Order Status — ${order.mgtOrderNumber ? `MGT-${order.mgtOrderNumber}` : order.id}`)
      .setColor(order.status === "Completed" ? 0x22C55E : order.status === "Active" || order.status === "Assigned" ? 0x3B82F6 : 0x6B7280)
      .addFields(
        { name: "Service", value: service?.name || "N/A", inline: true },
        { name: "Status", value: order.status, inline: true },
        { name: "Grinder", value: grinderInfo, inline: true },
        { name: "Deadline", value: order.orderDueDate ? new Date(order.orderDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A", inline: true },
        { name: "Platform", value: order.platform || "N/A", inline: true },
        { name: "Last Update", value: lastUpdate },
      )
      .setTimestamp()
      .setFooter({ text: "SP Grinder Queue" });

    if (assignment?.customerApproved) {
      embed.addFields({ name: "Customer Approval", value: `✅ Approved on ${new Date(assignment.customerApprovedAt!).toLocaleDateString()}`, inline: true });
    } else if (assignment?.status === "Completed" && !assignment?.customerApproved) {
      embed.addFields({ name: "Customer Approval", value: "⏳ Pending your approval", inline: true });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error: any) {
    await interaction.reply({ content: "Something went wrong fetching order status.", ephemeral: true });
  }
}

async function handleMyOrders(interaction: ChatInputCommandInteraction) {
  const customerDiscordId = interaction.user.id;

  try {
    const allOrders = await storage.getOrders();
    const myOrders = allOrders.filter((o: any) => o.customerDiscordId === customerDiscordId);

    if (myOrders.length === 0) {
      await interaction.reply({ content: "No orders found linked to your Discord account.", ephemeral: true });
      return;
    }

    const services = await storage.getServices();
    const sorted = myOrders.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 10);

    const embed = new EmbedBuilder()
      .setTitle(`📦 Your Orders (${myOrders.length} total)`)
      .setColor(0x5865F2)
      .setTimestamp()
      .setFooter({ text: "Showing up to 10 most recent • SP Grinder Queue" });

    for (const order of sorted) {
      const service = services.find((s: any) => s.id === order.serviceId);
      const statusEmoji = order.status === "Completed" ? "✅" : order.status === "Assigned" ? "🔵" : order.status === "Open" ? "🟡" : "⚪";
      embed.addFields({
        name: `${statusEmoji} ${order.mgtOrderNumber ? `MGT-${order.mgtOrderNumber}` : order.id}`,
        value: `**Service:** ${service?.name || "N/A"}\n**Status:** ${order.status}\n**Deadline:** ${order.orderDueDate ? new Date(order.orderDueDate).toLocaleDateString() : "N/A"}`,
        inline: true,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error: any) {
    await interaction.reply({ content: "Something went wrong fetching your orders.", ephemeral: true });
  }
}

async function handleButtonInteraction(interaction: ButtonInteraction) {
  const customId = interaction.customId;

  if (customId.startsWith("customer_approve:")) {
    const token = customId.replace("customer_approve:", "");
    const result = await handleCustomerApprovalButton(token, interaction.user.id);

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle("✅ Order Approved!")
        .setColor(0x22C55E)
        .setDescription(result.message)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });

      try {
        const msg = interaction.message;
        if (msg && msg.components?.length) {
          const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId("approved_done").setLabel("✅ Approved").setStyle(ButtonStyle.Success).setDisabled(true),
          );
          await msg.edit({ components: [disabledRow] });
        }
      } catch {}
    } else {
      await interaction.reply({ content: result.message, ephemeral: true });
    }
    return;
  }

  if (customId.startsWith("customer_issue:")) {
    const token = customId.replace("customer_issue:", "");
    const result = await handleCustomerIssueButton(token, interaction.user.id);

    if (result.success) {
      const embed = new EmbedBuilder()
        .setTitle("⚠️ Issue Submitted")
        .setColor(0xEF4444)
        .setDescription(result.message)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });

      try {
        const msg = interaction.message;
        if (msg && msg.components?.length) {
          const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId("issue_done").setLabel("⚠️ Issue Reported").setStyle(ButtonStyle.Danger).setDisabled(true),
          );
          await msg.edit({ components: [disabledRow] });
        }
      } catch {}
    } else {
      await interaction.reply({ content: result.message, ephemeral: true });
    }
    return;
  }

  await interaction.reply({ content: "Unknown action.", ephemeral: true });
}


export async function startDiscordBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn("DISCORD_BOT_TOKEN not set, skipping Discord bot startup");
    return;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel],
    sweepers: {
      messages: { interval: 300, lifetime: 600 },
      users: { interval: 600, filter: () => (u: any) => u.bot && u.id !== client?.user?.id },
    },
    rest: { timeout: 15_000 },
  });

  client.once("ready", async () => {
    if (!client?.user) return;
    console.log(`[discord] Discord bot logged in as ${client.user.tag}`);

    try {
      const rest = new REST({ version: "10" }).setToken(token);
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands.map(c => c.toJSON()) }
      );
      console.log("[discord] Slash commands registered globally");
    } catch (error) {
      console.error("Failed to register slash commands:", error);
    }

    console.log("[discord] MGT Bot watcher active - monitoring bid war and proposals channels");

    backfillMissedMessages(client!).catch(err => {
      console.error("[discord] Backfill error:", err);
    });

    startProposalBidSync(client!);

    try {
      const allGrinders = await storage.getGrinders();
      const unknownGrinders = allGrinders.filter((g: any) => g.name === "Unknown" && g.discordUserId);
      if (unknownGrinders.length > 0) {
        console.log(`[discord] Fixing ${unknownGrinders.length} grinder(s) with "Unknown" name...`);
        for (const grinder of unknownGrinders) {
          try {
            const guilds = client!.guilds.cache;
            for (const [, guild] of guilds) {
              const member = await guild.members.fetch(grinder.discordUserId).catch(() => null);
              if (member) {
                const displayName = member.displayName || member.user.globalName || member.user.username;
                const username = member.user.username;
                await storage.updateGrinder(grinder.id, { name: displayName, discordUsername: username });
                console.log(`[discord] Fixed grinder ${grinder.id}: "Unknown" → "${displayName}" (@${username})`);
                break;
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error("[discord] Error fixing unknown grinder names:", e);
    }
  });

  client.on("messageCreate", async (message) => {
    try {
      await handleNewOrderMessage(message);
      await handleProposalMessage(message);
      await handleRulesAcceptance(message);
    } catch (error) {
      console.error("[discord] Error in message handler:", error);
    }
  });

  client.on("messageUpdate", async (oldMessage, newMessage) => {
    try {
      await handleMessageUpdate(oldMessage, newMessage);
    } catch (error) {
      console.error("[discord] Error in message update handler:", error);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton()) {
      try {
        await handleButtonInteraction(interaction);
      } catch (error) {
        console.error("[discord] Error handling button:", error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: "Something went wrong.", ephemeral: true });
        }
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const CUSTOMER_COMMANDS = ["requestupdate", "orderstatus", "myorders"];
    const isCustomerCommand = CUSTOMER_COMMANDS.includes(interaction.commandName);

    if (!isCustomerCommand) {
      const STAFF_ROLE_ID = "1466369178729578663";
      const OWNER_ROLE_ID = "1466369177043599514";
      const member = interaction.member;
      const roles = member && "cache" in (member.roles as any)
        ? (member.roles as any).cache
        : member?.roles;
      const hasAccess = roles && (
        (typeof roles.has === "function" && (roles.has(STAFF_ROLE_ID) || roles.has(OWNER_ROLE_ID))) ||
        (Array.isArray(roles) && (roles.includes(STAFF_ROLE_ID) || roles.includes(OWNER_ROLE_ID)))
      );

      if (!hasAccess) {
        await interaction.reply({ content: "You don't have permission to use this command. Staff or Owner role required.", ephemeral: true });
        return;
      }
    }

    try {
      switch (interaction.commandName) {
        case "queue": await handleQueue(interaction); break;
        case "dashboard": await handleDashboard(interaction); break;
        case "orders": await handleOrders(interaction); break;
        case "grinders": await handleGrinders(interaction); break;
        case "bids": await handleBids(interaction); break;
        case "assignments": await handleAssignments(interaction); break;
        case "neworder": await handleNewOrder(interaction); break;
        case "setprice": await handleSetPrice(interaction); break;
        case "placebid": await handlePlaceBid(interaction); break;
        case "assign": await handleAssign(interaction); break;
        case "requestupdate": await handleRequestUpdate(interaction); break;
        case "orderstatus": await handleOrderStatus(interaction); break;
        case "myorders": await handleMyOrders(interaction); break;
        default:
          await interaction.reply({ content: "Unknown command.", ephemeral: true });
      }
    } catch (error) {
      console.error(`Error handling command ${interaction.commandName}:`, error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "Something went wrong. Please try again.", ephemeral: true });
      }
    }
  });

  await client.login(token);
}
