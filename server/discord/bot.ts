import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { storage } from "../storage";

let client: Client | null = null;

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
    .setName("placebid")
    .setDescription("Place a bid on an order")
    .addStringOption(opt =>
      opt.setName("order").setDescription("Order ID (e.g. O1001)").setRequired(true))
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
];

async function handleQueue(interaction: ChatInputCommandInteraction) {
  const items = await storage.getTopQueueItems();
  if (items.length === 0) {
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Priority Queue").setDescription("No items in queue.").setColor(0x5865F2)] });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Priority Queue - Top Items")
    .setColor(0x5865F2)
    .setTimestamp();

  for (const item of items.slice(0, 5)) {
    embed.addFields({
      name: `${item.orderId} - ${item.serviceName}`,
      value: `Grinder: **${item.grinderName}** (${item.tier})\nBid: $${item.bidAmount} | Price: $${item.customerPrice}\nScore: ${item.finalPriorityScore.toFixed(2)}`,
      inline: false,
    });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleDashboard(interaction: ChatInputCommandInteraction) {
  const stats = await storage.getDashboardStats();

  const embed = new EmbedBuilder()
    .setTitle("Dashboard Overview")
    .setColor(0x57F287)
    .addFields(
      { name: "Active Orders", value: String(stats.activeOrders), inline: true },
      { name: "Completed", value: String(stats.completedToday), inline: true },
      { name: "Available Grinders", value: `${stats.availableGrinders} / ${stats.totalGrinders}`, inline: true },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleOrders(interaction: ChatInputCommandInteraction) {
  const allOrders = await storage.getOrders();
  const openOrders = allOrders.filter(o => o.status === "Open");

  if (openOrders.length === 0) {
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Open Orders").setDescription("No open orders.").setColor(0xFEE75C)] });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Open Orders (${openOrders.length})`)
    .setColor(0xFEE75C)
    .setTimestamp();

  for (const order of openOrders.slice(0, 10)) {
    const rush = order.isRush ? " RUSH" : "";
    embed.addFields({
      name: `${order.id}${rush}`,
      value: `Price: $${order.customerPrice} | Complexity: ${order.complexity}/5\nDue: ${order.orderDueDate ? new Date(order.orderDueDate).toLocaleDateString() : "N/A"}\nStatus: ${order.status}`,
      inline: true,
    });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleGrinders(interaction: ChatInputCommandInteraction) {
  const allGrinders = await storage.getGrinders();

  if (allGrinders.length === 0) {
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Grinders").setDescription("No grinders registered.").setColor(0xED4245)] });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Grinders (${allGrinders.length})`)
    .setColor(0xEB459E)
    .setTimestamp();

  for (const g of allGrinders.slice(0, 10)) {
    const available = Number(g.activeOrders) < g.capacity;
    const statusLabel = available ? "[AVAILABLE]" : "[FULL]";
    embed.addFields({
      name: `${statusLabel} ${g.name} (${g.id})`,
      value: `Tier: ${g.tier} | Capacity: ${g.activeOrders}/${g.capacity}\nStrikes: ${g.strikes} | Utilization: ${(Number(g.utilization) * 100).toFixed(0)}%`,
      inline: true,
    });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleBids(interaction: ChatInputCommandInteraction) {
  const allBids = await storage.getBids();
  const pendingBids = allBids.filter(b => b.status === "Pending");

  if (pendingBids.length === 0) {
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Pending Bids").setDescription("No pending bids.").setColor(0x5865F2)] });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Pending Bids (${pendingBids.length})`)
    .setColor(0x5865F2)
    .setTimestamp();

  for (const b of pendingBids.slice(0, 10)) {
    embed.addFields({
      name: `${b.id} - Order ${b.orderId}`,
      value: `Grinder: ${b.grinderId} | Amount: $${b.bidAmount}\nEst. Delivery: ${b.estDeliveryDate ? new Date(b.estDeliveryDate).toLocaleDateString() : "N/A"}`,
      inline: true,
    });
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleAssignments(interaction: ChatInputCommandInteraction) {
  const allAssignments = await storage.getAssignments();
  const active = allAssignments.filter(a => a.status === "Active");

  if (active.length === 0) {
    await interaction.reply({ embeds: [new EmbedBuilder().setTitle("Active Assignments").setDescription("No active assignments.").setColor(0x57F287)] });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Active Assignments (${active.length})`)
    .setColor(0x57F287)
    .setTimestamp();

  for (const a of active.slice(0, 10)) {
    embed.addFields({
      name: `${a.id} - Order ${a.orderId}`,
      value: `Grinder: ${a.grinderId} | Status: ${a.status}\nDue: ${a.dueDateTime ? new Date(a.dueDateTime).toLocaleDateString() : "N/A"}`,
      inline: true,
    });
  }

  await interaction.reply({ embeds: [embed] });
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

    await interaction.reply({ embeds: [embed] });
  } catch (error: any) {
    await interaction.reply({ content: `Failed to create order: ${error.message}`, ephemeral: true });
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

    await interaction.reply({ embeds: [embed] });
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
      await interaction.reply({ content: `Grinder "${grinder.name}" is at full capacity (${grinder.activeOrders}/${grinder.capacity}).`, ephemeral: true });
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

    await interaction.reply({ embeds: [embed] });
  } catch (error: any) {
    await interaction.reply({ content: `Failed to create assignment: ${error.message}`, ephemeral: true });
  }
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
    ],
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
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      switch (interaction.commandName) {
        case "queue": await handleQueue(interaction); break;
        case "dashboard": await handleDashboard(interaction); break;
        case "orders": await handleOrders(interaction); break;
        case "grinders": await handleGrinders(interaction); break;
        case "bids": await handleBids(interaction); break;
        case "assignments": await handleAssignments(interaction); break;
        case "neworder": await handleNewOrder(interaction); break;
        case "placebid": await handlePlaceBid(interaction); break;
        case "assign": await handleAssign(interaction); break;
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
