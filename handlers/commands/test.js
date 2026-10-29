const fs = require('fs');
const path = require('path');

const { prefix } = require('../../config.json');

module.exports = 
{
    name: 'test',
    description: 'Returns with a message.',
    aliases: ['test'],
    usage: '[command name]',
    cooldown: 1,
	async execute(client, message, args)
	{
		return message.reply(`Reply`);
	}
};
