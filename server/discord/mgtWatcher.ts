import { type Message, type PartialMessage, type GuildMember } from "discord.js";
import { storage } from "../storage";
import { GRINDER_ROLES, ROLE_CAPACITY, ROLE_LABELS } from "@shared/schema";
import { recalcGrinderStats } from "../recalcStats";

const MGT_BOT_USER_ID = "1466336342521937930";
const BID_WAR_CHANNEL_ID = "1467912681670447140";
const BID_PROPOSALS_CHANNEL_ID = "1467929083366084800";

export async function handleRulesAcceptance(message: Message): Promise<void> {
  if (message.author.id !== MGT_BOT_USER_ID) return;

  try {
    for (const embed of message.embeds) {
      const title = embed.title || "";
      const desc = embed.description || "";
      const fullText = `${title} ${desc}`;
      const fullTextLower = fullText.toLowerCase();

      if (!fullTextLower.includes("rules") && !fullTextLower.includes("guidelines")) continue;
      if (!fullTextLower.includes("accepted") && !fullText.includes("✅")) continue;

      const mentionMatch = embed.description?.match(/<@!?(\d+)>/);
      const footerMatch = embed.footer?.text?.match(/(\d+)/);
      const discordUserId = mentionMatch?.[1] || footerMatch?.[1];

      if (!discordUserId) {
        if (message.interaction?.user?.id) {
          const userId = message.interaction.user.id;
          const allGrinders = await storage.getGrinders();
          const grinder = allGrinders.find((g: any) => g.discordUserId === userId);
          if (grinder && !grinder.rulesAccepted) {
            await storage.updateGrinder(grinder.id, {
              rulesAccepted: true,
              rulesAcceptedAt: new Date(),
            });
            console.log(`[mgt-watcher] Rules accepted by ${grinder.name} (${grinder.id}) via MGT Bot interaction`);
          }
        }
        continue;
      }

      const allGrinders = await storage.getGrinders();
      const grinder = allGrinders.find((g: any) => g.discordUserId === discordUserId);
      if (grinder && !grinder.rulesAccepted) {
        await storage.updateGrinder(grinder.id, {
          rulesAccepted: true,
          rulesAcceptedAt: new Date(),
        });
        console.log(`[mgt-watcher] Rules accepted by ${grinder.name} (${grinder.id}) via MGT Bot embed`);
      }
    }
  } catch (error) {
    console.error("[mgt-watcher] Error handling rules acceptance:", error);
  }
}

function extractNumber(text: string): number | null {
  const match = text.match(/\$?([\d,]+\.?\d*)/);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ""));
}

function detectGrinderRole(member: GuildMember | null): { roleId: string; category: string; capacity: number; roles: string[] } {
  if (!member) return { roleId: GRINDER_ROLES.GRINDER, category: "Grinder", capacity: 5, roles: ["Grinder"] };
  
  const memberRoleIds = member.roles.cache.map(r => r.id);
  const roles: string[] = [];

  const allRoleIds = Object.values(GRINDER_ROLES) as string[];
  for (const rid of allRoleIds) {
    if (memberRoleIds.includes(rid)) {
      const label = ROLE_LABELS[rid];
      if (label && !roles.includes(label)) {
        roles.push(label);
      }
    }
  }

  let primaryRoleId = GRINDER_ROLES.GRINDER;
  let primaryCategory = "Grinder";
  let primaryCapacity = 5;

  if (memberRoleIds.includes(GRINDER_ROLES.ELITE)) {
    primaryRoleId = GRINDER_ROLES.ELITE;
    primaryCategory = "Elite Grinder";
    primaryCapacity = ROLE_CAPACITY[GRINDER_ROLES.ELITE] || 5;
  } else if (memberRoleIds.includes(GRINDER_ROLES.VC_1) || memberRoleIds.includes(GRINDER_ROLES.VC_2)) {
    primaryRoleId = GRINDER_ROLES.VC_1;
    primaryCategory = "VC Grinder";
    primaryCapacity = ROLE_CAPACITY[GRINDER_ROLES.VC_1] || 3;
  } else if (memberRoleIds.includes(GRINDER_ROLES.EVENT)) {
    primaryRoleId = GRINDER_ROLES.EVENT;
    primaryCategory = "Event Grinder";
    primaryCapacity = ROLE_CAPACITY[GRINDER_ROLES.EVENT] || 3;
  } else if (memberRoleIds.includes(GRINDER_ROLES.GRINDER)) {
    primaryRoleId = GRINDER_ROLES.GRINDER;
    primaryCategory = "Grinder";
    primaryCapacity = ROLE_CAPACITY[GRINDER_ROLES.GRINDER] || 3;
  }

  if (roles.length === 0) roles.push(primaryCategory);

  return { roleId: primaryRoleId, category: primaryCategory, capacity: primaryCapacity, roles };
}

async function findOrCreateService(serviceName: string): Promise<string> {
  const allServices = await storage.getServices();

  for (const s of allServices) {
    const sLower = s.name.toLowerCase();
    const inputLower = serviceName.toLowerCase();
    if (sLower === inputLower) return s.id;
    if (inputLower.includes("vc") && sLower.includes("vc")) return s.id;
    if (inputLower.includes("rep") && sLower.includes("rep")) return s.id;
    if (inputLower.includes("badge") && sLower.includes("badge")) return s.id;
    if (inputLower.includes("build") && sLower.includes("build")) return s.id;
  }

  const serviceId = `SVC-${Date.now().toString(36).toUpperCase()}`;
  let group = "Other";
  const lower = serviceName.toLowerCase();
  if (lower.includes("vc") || lower.includes("virtual currency")) group = "VC";
  else if (lower.includes("rep")) group = "Rep";
  else if (lower.includes("badge")) group = "Badge";
  else if (lower.includes("build")) group = "Build";

  await storage.createService({
    id: serviceId,
    name: serviceName,
    group,
    defaultComplexity: 1,
    slaDays: 3,
  });

  console.log(`[mgt-watcher] Created new service: ${serviceName} (${serviceId})`);
  return serviceId;
}

export async function handleNewOrderMessage(message: Message) {
  if (message.author.id !== MGT_BOT_USER_ID) return;
  if (message.channel.id !== BID_WAR_CHANNEL_ID) return;
  if (!message.embeds || message.embeds.length === 0) return;

  const embed = message.embeds[0];
  const title = embed.title || "";
  const description = embed.description || "";

  const hasOrderKeywords = title.toLowerCase().includes("order") ||
                           description.toLowerCase().includes("order") ||
                           description.toLowerCase().includes("proposal");
  if (!hasOrderKeywords) return;

  try {
    let orderNumber: number | null = null;
    let serviceName: string | null = null;
    let platform: string | null = null;
    let gamertag: string | null = null;
    let orderNotes: string | null = null;
    let customerPrice: number | null = null;

    for (const field of embed.fields || []) {
      const name = field.name.replace(/[^\w\s]/g, "").trim().toLowerCase();
      const value = field.value.trim();

      if (name.includes("order id") || name.includes("order")) {
        const numMatch = value.match(/#?(\d+)/);
        if (numMatch) orderNumber = parseInt(numMatch[1], 10);
      }
      if (name.includes("service")) serviceName = value;
      if (name.includes("platform")) platform = value;
      if (name.includes("gamertag")) gamertag = value;
      if (name.includes("order notes") || name.includes("notes")) orderNotes = value;
      if (name.includes("customer price") || name.includes("price")) customerPrice = extractNumber(value);
    }

    if (!orderNumber) {
      const titleMatch = title.match(/#(\d+)/) || description.match(/#(\d+)/);
      if (titleMatch) orderNumber = parseInt(titleMatch[1], 10);
    }
    if (!orderNumber) {
      const orderMatch = (title + " " + description).match(/Order\s*#?(\d+)/i);
      if (orderMatch) orderNumber = parseInt(orderMatch[1], 10);
    }

    if (!orderNumber) {
      console.log("[mgt-watcher] Skipped bid war message - no order number found");
      return;
    }

    const serviceId = serviceName ? await findOrCreateService(serviceName) : "S1";
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const briefParts: string[] = [];
    if (serviceName) briefParts.push(`**Service:** ${serviceName}`);
    if (platform) briefParts.push(`**Platform:** ${platform}`);
    briefParts.push(`**Order ID:** #${orderNumber}`);
    if (gamertag) briefParts.push(`**Gamertag:** ${gamertag}`);
    if (orderNotes) briefParts.push(`**Order Notes:** ${orderNotes}`);
    if (customerPrice) briefParts.push(`**Customer Price:** $${customerPrice.toFixed(2)}`);
    const orderBrief = briefParts.join("\n");

    const guildId = message.guild?.id;
    const discordBidLink = guildId ? `https://discord.com/channels/${guildId}/${BID_WAR_CHANNEL_ID}/${message.id}` : undefined;

    const order = await storage.upsertOrderByMgtNumber(orderNumber, {
      serviceId,
      customerPrice: customerPrice ? customerPrice.toFixed(2) : "0",
      platform: platform || undefined,
      gamertag: gamertag || undefined,
      notes: orderNotes || undefined,
      orderBrief,
      discordBidLink,
      orderDueDate: dueDate,
      discordMessageId: message.id,
      status: "Open",
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}`,
      entityType: "order",
      entityId: order.id,
      action: "imported_from_mgt",
      actor: "mgt-bot",
      details: JSON.stringify({ orderNumber, customerPrice, serviceName, platform }),
    });

    console.log(`[mgt-watcher] Tracked order #${orderNumber} -> ${order.id} (service: ${serviceId})`);
  } catch (error) {
    console.error("[mgt-watcher] Error parsing order embed:", error);
  }
}

export async function handleProposalMessage(message: Message) {
  if (message.author.id !== MGT_BOT_USER_ID) return;
  if (message.channel.id !== BID_PROPOSALS_CHANNEL_ID) return;
  if (!message.embeds || message.embeds.length === 0) return;

  const embed = message.embeds[0];
  const title = embed.title || "";
  const description = embed.description || "";

  if (!title.toLowerCase().includes("proposal") && !description.toLowerCase().includes("proposal")) return;

  try {
    let orderNumber: number | null = null;
    let grinderName: string | null = null;
    let grinderDiscordId: string | null = null;
    let grinderTier: string = "New";
    let bidAmount: number | null = null;
    let timeline: string | null = null;
    let canStart: string | null = null;
    let serviceName: string | null = null;
    let platform: string | null = null;
    let customerPrice: number | null = null;
    let margin: number | null = null;
    let marginPct: number | null = null;
    let proposalId: number | null = null;
    let qualityScore: number | null = null;
    let totalOrders = 0;
    let totalReviews = 0;
    let winRate: string | null = null;

    const orderMatch = title.match(/Order\s*#?(\d+)/i) || description.match(/Order\s*#?(\d+)/i);
    if (orderMatch) orderNumber = parseInt(orderMatch[1], 10);

    const grinderMention = description.match(/<@!?(\d+)>/);
    if (grinderMention) grinderDiscordId = grinderMention[1];

    const grinderNameMatch = description.match(/Grinder:\s*(?:<@!?\d+>\s*)?@?(\w+)/i);
    if (grinderNameMatch) grinderName = grinderNameMatch[1];

    const tierMatch = description.match(/Tier:\s*[^\n]*?(\w+)/i);
    if (tierMatch) {
      const cleaned = tierMatch[1].replace(/[^a-zA-Z]/g, "").trim();
      if (cleaned) grinderTier = cleaned;
    }

    for (const field of embed.fields || []) {
      const name = field.name.replace(/[^\w\s]/g, "").trim().toLowerCase();
      const value = field.value.trim();

      if (name.includes("bid amount")) {
        bidAmount = extractNumber(value);
      } else if (name.includes("timeline")) {
        timeline = value;
      } else if (name.includes("can start")) {
        canStart = value;
      } else if (name.includes("grinder stats")) {
        const ordersMatch = value.match(/(\d+)\s*orders?/i);
        if (ordersMatch) totalOrders = parseInt(ordersMatch[1], 10);
        const reviewsMatch = value.match(/(\d+)\s*reviews?/i);
        if (reviewsMatch) totalReviews = parseInt(reviewsMatch[1], 10);
        const winRateMatch = value.match(/([\d.]+)%\s*win\s*rate/i);
        if (winRateMatch) winRate = (parseFloat(winRateMatch[1]) / 100).toFixed(4);
      } else if (name.includes("service")) {
        serviceName = value;
      } else if (name.includes("platform")) {
        platform = value;
      } else if (name.includes("customer price")) {
        customerPrice = extractNumber(value);
      } else if (name.includes("grinder bid")) {
        if (!bidAmount) bidAmount = extractNumber(value);
      } else if (name.includes("margin")) {
        const marginMatch = value.match(/\$?([\d,]+\.?\d*)\s*\((\d+)%?\)/);
        if (marginMatch) {
          margin = parseFloat(marginMatch[1].replace(/,/g, ""));
          marginPct = parseFloat(marginMatch[2]);
        } else {
          margin = extractNumber(value);
        }
      }
    }

    const footerText = embed.footer?.text || "";
    const allText = title + " " + description + " " + footerText;

    for (const field of embed.fields || []) {
      const combined = field.name + " " + field.value;
      const pMatch = combined.match(/Proposal\s*ID:?\s*(\d+)/i);
      if (pMatch && !proposalId) proposalId = parseInt(pMatch[1], 10);
      const qMatch = combined.match(/Quality\s*Score:?\s*(\d+)/i);
      if (qMatch && !qualityScore) qualityScore = parseInt(qMatch[1], 10);
    }

    if (!proposalId) {
      const pMatch = allText.match(/Proposal\s*ID:?\s*(\d+)/i);
      if (pMatch) proposalId = parseInt(pMatch[1], 10);
    }
    if (!qualityScore) {
      const qMatch = allText.match(/Quality\s*Score:?\s*(\d+)/i);
      if (qMatch) qualityScore = parseInt(qMatch[1], 10);
    }

    if (!orderNumber) {
      console.log("[mgt-watcher] Skipped proposal - no order number found");
      return;
    }
    if (!proposalId) {
      console.log(`[mgt-watcher] Skipped proposal for order #${orderNumber} - no proposal ID found`);
      return;
    }

    let grinderId: string | null = null;
    if (grinderDiscordId) {
      let roleInfo = { roleId: GRINDER_ROLES.GRINDER as string, category: "Grinder", capacity: 5, roles: ["Grinder"] as string[] };
      let memberDisplayName: string | null = null;
      let memberUsername: string | null = null;
      try {
        const guild = message.guild;
        if (guild) {
          const member = await guild.members.fetch(grinderDiscordId).catch(() => null);
          if (member) {
            roleInfo = detectGrinderRole(member);
            memberDisplayName = member.displayName || member.user.globalName || member.user.username;
            memberUsername = member.user.username;
          }
        }
      } catch (e) {}

      const resolvedName = grinderName || memberDisplayName || "Unknown";
      const resolvedUsername = memberUsername || grinderName || undefined;

      const grinder = await storage.upsertGrinderByDiscordId(grinderDiscordId, {
        name: resolvedName,
        discordUsername: resolvedUsername,
        tier: grinderTier,
        discordRoleId: roleInfo.roleId,
        category: roleInfo.category,
        roles: roleInfo.roles,
        capacity: roleInfo.capacity,
        totalOrders,
        totalReviews,
        winRate: winRate || undefined,
      });
      grinderId = grinder.id;
    }

    if (!grinderId) {
      console.log(`[mgt-watcher] Skipped proposal #${proposalId} - no grinder Discord ID found`);
      return;
    }

    let order = await storage.getOrderByMgtNumber(orderNumber);
    if (!order) {
      const serviceId = serviceName ? await findOrCreateService(serviceName) : "S1";
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      order = await storage.upsertOrderByMgtNumber(orderNumber, {
        serviceId,
        customerPrice: customerPrice ? customerPrice.toFixed(2) : "0",
        platform: platform || undefined,
        orderDueDate: dueDate,
        status: "Open",
      });
    } else if (customerPrice && Number(order.customerPrice) === 0) {
      order = await storage.upsertOrderByMgtNumber(orderNumber, {
        customerPrice: customerPrice.toFixed(2),
        platform: platform || order.platform || undefined,
      });
    }

    if (serviceName && order.serviceId === "S1") {
      const serviceId = await findOrCreateService(serviceName);
      if (serviceId !== "S1") {
        await storage.upsertOrderByMgtNumber(orderNumber, { serviceId });
      }
    }

    const estDelivery = new Date();
    if (timeline) {
      const hoursMatch = timeline.match(/(\d+)\s*hours?/i);
      const daysMatch = timeline.match(/(\d+)\s*days?/i);
      if (hoursMatch) estDelivery.setHours(estDelivery.getHours() + parseInt(hoursMatch[1], 10));
      else if (daysMatch) estDelivery.setDate(estDelivery.getDate() + parseInt(daysMatch[1], 10));
      else estDelivery.setDate(estDelivery.getDate() + 1);
    } else {
      estDelivery.setDate(estDelivery.getDate() + 1);
    }

    let status = "Pending";
    let acceptedBy: string | undefined;

    const statusLine = footerText + " " + description;
    const acceptMatch = statusLine.match(/ACCEPTED\s*(?:by\s*)?(\w+)/i);
    if (acceptMatch) {
      status = "Accepted";
      acceptedBy = acceptMatch[1];
    } else if (/\bDENIED\b/i.test(statusLine) || /\bREJECTED\b/i.test(statusLine)) {
      status = "Rejected";
    } else if (/\bCOUNTER(?:ED)?\b/i.test(statusLine)) {
      status = "Countered";
    }

    const bid = await storage.upsertBidByProposalId(proposalId, {
      orderId: order.id,
      grinderId,
      bidAmount: bidAmount ? bidAmount.toFixed(2) : "0",
      estDeliveryDate: estDelivery,
      timeline: timeline || undefined,
      canStart: canStart || undefined,
      qualityScore: qualityScore || undefined,
      margin: margin ? margin.toFixed(2) : undefined,
      marginPct: marginPct ? marginPct.toFixed(2) : undefined,
      discordMessageId: message.id,
      status,
      acceptedBy,
    });

    await storage.createAuditLog({
      id: `AL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      entityType: "bid",
      entityId: bid.id,
      action: `proposal_${status.toLowerCase()}`,
      actor: "mgt-bot",
      details: JSON.stringify({ proposalId, orderNumber, grinderId, bidAmount, status }),
    });

    console.log(`[mgt-watcher] Tracked proposal #${proposalId} for order #${orderNumber} -> ${bid.id} (${status})`);

    if (status === "Accepted" && (order.status === "Open" || order.status === "Bidding Closed")) {
      await storage.updateOrderStatus(order.id, "Assigned");
      const assignmentId = `A${Date.now().toString(36).toUpperCase()}`;
      const orderPrice = Number(order.customerPrice) || 0;
      const grinderEarnings = bidAmount || 0;
      const companyProfit = orderPrice - grinderEarnings;

      await storage.createAssignment({
        id: assignmentId,
        grinderId,
        orderId: order.id,
        dueDateTime: order.orderDueDate,
        status: "Active",
        bidAmount: bidAmount ? bidAmount.toFixed(2) : undefined,
        orderPrice: orderPrice.toFixed(2),
        margin: margin ? margin.toFixed(2) : companyProfit.toFixed(2),
        marginPct: marginPct ? marginPct.toFixed(2) : (orderPrice > 0 ? ((companyProfit / orderPrice) * 100).toFixed(2) : "0"),
        companyProfit: companyProfit.toFixed(2),
        grinderEarnings: grinderEarnings.toFixed(2),
      });

      await storage.updateOrder(order.id, {
        assignedGrinderId: grinderId,
        acceptedBidId: bid.id,
        companyProfit: companyProfit.toFixed(2),
      });

      await storage.updateGrinder(grinderId, { lastAssigned: new Date() });
      await recalcGrinderStats(grinderId);

      const allBidsForOrder = await storage.getBids();
      const otherPending = allBidsForOrder.filter(b => b.orderId === order.id && b.id !== bid.id && (b.status === "Pending" || b.status === "Countered"));
      for (const ob of otherPending) {
        await storage.updateBidStatus(ob.id, "Denied", acceptedBy || "mgt-bot");
      }
      if (otherPending.length > 0) {
        console.log(`[mgt-watcher] Auto-denied ${otherPending.length} other bid(s) on order ${order.id}`);
      }

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}-asgn`,
        entityType: "assignment",
        entityId: assignmentId,
        action: "auto_created",
        actor: "mgt-bot",
        details: JSON.stringify({ grinderId, orderId: order.id, grinderEarnings, companyProfit }),
      });

      console.log(`[mgt-watcher] Auto-created assignment ${assignmentId} for accepted proposal`);
    }
  } catch (error) {
    console.error("[mgt-watcher] Error parsing proposal embed:", error);
  }
}

export async function handleMessageUpdate(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) {
  if (newMessage.author && newMessage.author.id !== MGT_BOT_USER_ID) return;
  if (newMessage.channel.id !== BID_PROPOSALS_CHANNEL_ID) return;

  try {
    const message = newMessage.partial ? await newMessage.fetch() : newMessage;
    if (!message.embeds || message.embeds.length === 0) return;

    const embed = message.embeds[0];
    const footerText = embed.footer?.text || "";
    const description = embed.description || "";
    const title = embed.title || "";

    let proposalId: number | null = null;
    const allText = title + " " + description + " " + footerText;
    for (const field of embed.fields || []) {
      const pMatch = (field.name + " " + field.value).match(/Proposal\s*ID:?\s*(\d+)/i);
      if (pMatch) { proposalId = parseInt(pMatch[1], 10); break; }
    }
    if (!proposalId) {
      const pMatch = allText.match(/Proposal\s*ID:?\s*(\d+)/i);
      if (pMatch) proposalId = parseInt(pMatch[1], 10);
    }

    if (!proposalId) return;

    const existingBid = await storage.getBidByProposalId(proposalId);
    if (!existingBid) {
      await handleProposalMessage(message);
      return;
    }

    let newStatus = existingBid.status;
    let acceptedBy: string | undefined;

    const statusLine = footerText + " " + description;
    const acceptMatch = statusLine.match(/ACCEPTED\s*(?:by\s*)?(\w+)/i);
    if (acceptMatch) {
      newStatus = "Accepted";
      acceptedBy = acceptMatch[1];
    } else if (/\bDENIED\b/i.test(statusLine) || /\bREJECTED\b/i.test(statusLine)) {
      newStatus = "Rejected";
    } else if (/\bCOUNTER(?:ED)?\b/i.test(statusLine)) {
      newStatus = "Countered";
    }

    if (newStatus !== existingBid.status) {
      await storage.updateBidStatus(existingBid.id, newStatus, acceptedBy);

      await storage.createAuditLog({
        id: `AL-${Date.now().toString(36)}-upd`,
        entityType: "bid",
        entityId: existingBid.id,
        action: `status_changed_to_${newStatus.toLowerCase()}`,
        actor: "mgt-bot",
        details: JSON.stringify({ proposalId, oldStatus: existingBid.status, newStatus }),
      });

      console.log(`[mgt-watcher] Updated proposal #${proposalId} status: ${existingBid.status} -> ${newStatus}`);

      if (newStatus === "Accepted") {
        const order = await storage.getOrder(existingBid.orderId);
        if (order && (order.status === "Open" || order.status === "Bidding Closed")) {
          await storage.updateOrderStatus(order.id, "Assigned");
          const assignmentId = `A${Date.now().toString(36).toUpperCase()}`;
          const orderPrice = Number(order.customerPrice) || 0;
          const grinderEarnings = Number(existingBid.bidAmount) || 0;
          const companyProfit = orderPrice - grinderEarnings;

          await storage.createAssignment({
            id: assignmentId,
            grinderId: existingBid.grinderId,
            orderId: existingBid.orderId,
            dueDateTime: order.orderDueDate,
            status: "Active",
            bidAmount: existingBid.bidAmount,
            orderPrice: orderPrice.toFixed(2),
            margin: existingBid.margin || companyProfit.toFixed(2),
            marginPct: existingBid.marginPct || (orderPrice > 0 ? ((companyProfit / orderPrice) * 100).toFixed(2) : "0"),
            companyProfit: companyProfit.toFixed(2),
            grinderEarnings: grinderEarnings.toFixed(2),
          });

          await storage.updateOrder(order.id, {
            assignedGrinderId: existingBid.grinderId,
            acceptedBidId: existingBid.id,
            companyProfit: companyProfit.toFixed(2),
          });

          await storage.updateGrinder(existingBid.grinderId, { lastAssigned: new Date() });
          await recalcGrinderStats(existingBid.grinderId);

          const allBidsForOrder = await storage.getBids();
          const otherPending = allBidsForOrder.filter(b => b.orderId === order.id && b.id !== existingBid.id && (b.status === "Pending" || b.status === "Countered"));
          for (const ob of otherPending) {
            await storage.updateBidStatus(ob.id, "Denied", acceptedBy || "mgt-bot");
          }
          if (otherPending.length > 0) {
            console.log(`[mgt-watcher] Auto-denied ${otherPending.length} other bid(s) on order ${order.id}`);
          }

          await storage.createAuditLog({
            id: `AL-${Date.now().toString(36)}-asgn2`,
            entityType: "assignment",
            entityId: assignmentId,
            action: "auto_created_from_update",
            actor: "mgt-bot",
            details: JSON.stringify({ grinderId: existingBid.grinderId, orderId: order.id, companyProfit, grinderEarnings }),
          });

          console.log(`[mgt-watcher] Auto-created assignment ${assignmentId} for accepted bid`);
        }
      }
    }
  } catch (error) {
    console.error("[mgt-watcher] Error handling message update:", error);
  }
}
