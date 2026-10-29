# Squarespace Purchase Reporting Discord Bot 

A discord bot that will send a Discord message in a specified Discord channel when a purchase is made on a specified Squarespace store. 

## Set Up
1. At the top of the GitHub Repo, click the green "Use this template" button > "Create a new repository" 
2. In your VS Code go to Terminal > New Terminal (or whatever the equivalent is in your IDE) and run the following:
  - `npm install` 
  - `npm init -y`
  - `npm install express`
  - `npm install discord.js dotenv`
3. In the [Discord Developer Portal](https://discord.com/developers/home) go to Applications > your_bot (or New Application) > Overview > Bot > Reset Token > Copy 
4. In your project's `config.json`, paste the token into the `token` field
5. Invite the bot to your discord server using the invite code generated in Applications > your_bot (or New Application) > Overview > OAuth2 
6. Copy `.env.example` to `.env` and paste a Squarespace API key (Settings > Developer Tools > Developer API Keys, with the Orders permission) into `SQUARESPACE_API_KEY`
7. Run the bot with `node index.js` 
