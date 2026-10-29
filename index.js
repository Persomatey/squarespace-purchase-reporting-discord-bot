require('events').defaultMaxListeners = 50;
require('dotenv').config();

const fs = require('fs'); 
const Discord = require('discord.js'); 
const Config = require('./config.json'); 
const BotLib = require('./lib/bot.js'); 
const DebugLib = require('./lib/debug.js'); 
const Keywords = require('./dispatchers/keywordDispatch');
const Commands = require('./dispatchers/commandDispatch');
const Squarespace = require('./helpers/squarespace.js');

// Declare necessary gateway intents
const client = new Discord.Client({
    ws: {
        intents: [
            'GUILDS',
            'GUILD_MESSAGES',
            'GUILD_MESSAGE_REACTIONS',
            'DIRECT_MESSAGES'
        ]
    },
    partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

client.botConfig = Config; 
client.botConfig.rootDir = __dirname; 

BotLib.loadHandlers(client, 'commands');
BotLib.loadHandlers(client, 'keywords');

const cooldowns = new Discord.Collection(); 

if(client.botConfig.debug) 
{
    console.log('Config Loaded: ', client.botConfig);
}

// Watch the Squarespace store for new purchases
if(process.env.SQUARESPACE_API_KEY)
{
	Squarespace.startOrderPoller(process.env.SQUARESPACE_API_KEY, order =>
	{
		const items = order.lineItems.map(item => `${item.quantity}x ${item.productName}`).join(', ');
		// console.log(`New purchase! Order #${order.orderNumber} by ${order.customerEmail} for ${order.grandTotal.value} ${order.grandTotal.currency}: ${items}`);
        // console.log(`${order}`); 
        // console.log(order); 
        // console.dir(order, { depth: null }); 
        console.log(JSON.stringify(order, null, 2)); 
        // Build one line per purchased item, e.g. "1x Test Transactions API for Integration (Meal Type: Salmon)"
        let options = '';

        for(const item of order.lineItems)
        {
            let line = `${item.quantity}x ${item.productName}`;

            // variantOptions is null for products without variants
            if(item.variantOptions && item.variantOptions.length)
            {
                const choices = [];
                for(const option of item.variantOptions)
                {
                    choices.push(`${option.optionName}: ${option.value}`);
                }
                line += ` (${choices.join(', ')})`;
            }
            
            options += `\n- ${line}`;

            // customizations holds the product form's answers (First & Last Name, Email, Phone, Message), or null if the product has no form
            if(item.customizations)
            {
                for(const field of item.customizations)
                {
                    options += `\n    ${field.label}: ${field.value || '(left blank)'}`;
                }
            }
        }

        var str = `New purchase! Order #${order.orderNumber}` +
            // `Name: ${order.billingAddress.firstName} ${order.billingAddress.lastName}\n` +
            // `Purchase: ${options}`; 
            `${options}`; 

        console.log(str);
        client.channels.fetch(client.botConfig.purchaseChannelId).then(channel => channel.send(str)).catch(err => console.error('Failed to post purchase to Discord:', err));

	}, Number(process.env.SQUARESPACE_POLL_SECONDS) || 60);
}
else
{
	console.warn('SQUARESPACE_API_KEY is not set in .env, purchases will not be reported');
}

// Functions
async function SendDM(client, userId, messageContent)
{
	try 
	{
		const user = await client.users.fetch(userId); // Get the user by ID
		await user.send(messageContent); // Send them a DM
		console.log(`DM sent to ${user.tag}`);
	} 
	catch (error) 
	{
		console.error("Failed to send DM:", error);
	}
}

// Starts the bot and sets its activity 
client.on('ready', () => 
{
    console.log('Bot Online');

	// client.user.setActivity(
	// {
	// 	name: 'the_thing_the_bot_is_doing',
	// 	type: 0
	// });
});

// Handle user messages
client.on('message', message => 
{
    // Check for keywords that don't use a real command structure
    if(Keywords.handle(client, message)) 
	{
        return; 
    }

    // Check for structured commands
    if(Commands.handle(client, message, cooldowns)) 
	{
        return; 
    }

    // Register debug message printer
    DebugLib.debugPrintMessages(client, message);
});

// Handle users reacting 
client.on('messageReactionAdd', async (reaction, user) => 
{
	
});

// Log the bot in using the token provided in the config file
client.login(client.botConfig.token).catch((err) => 
{
    console.log(`Failed to authenticate with Discord network.`, err);
});

process.on('unhandledRejection', (reason, promise) => 
{
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => 
{
    console.error('Uncaught Exception:', error);
});