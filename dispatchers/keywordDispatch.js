module.exports =
{
    handle(client, message)
    {
        const messageContent = message.content.toLowerCase();

        const keyword = client.keywords.find(kwd =>
            kwd.name === messageContent ||
            (kwd.aliases && kwd.aliases.some(a => a.toLowerCase() === messageContent))
        );

        if (!keyword) return false;

        try
        {
            keyword.execute(message);
            return true;
        }
        catch (error)
        {
            console.error(`Failed running keyword handler ${keyword.name}:`, error);
            return false;
        }
    }
}