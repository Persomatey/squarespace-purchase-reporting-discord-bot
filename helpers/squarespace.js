// Polls the Squarespace Orders API and calls onOrder for every order created after the poller started.
// Webhook subscriptions require an OAuth app, so polling with a regular API key is the simpler route.

const ORDERS_URL = 'https://api.squarespace.com/1.0/commerce/orders';
const USER_AGENT = 'squarespace-purchase-reporter-bot/1.0.0';

module.exports =
{
    startOrderPoller(apiKey, onOrder, intervalSeconds = 60)
    {
        const startedAt = new Date();
        const seenOrderIds = new Set();
        let lastCheck = startedAt;

        async function fetchOrders(params)
        {
            const response = await fetch(`${ORDERS_URL}?${new URLSearchParams(params)}`,
            {
                headers:
                {
                    'Authorization': `Bearer ${apiKey}`,
                    'User-Agent': USER_AGENT
                }
            });

            if(!response.ok)
            {
                throw new Error(`Squarespace API responded ${response.status}: ${await response.text()}`);
            }

            return response.json();
        }

        async function poll()
        {
            const now = new Date();

            // Look back an extra minute so orders modified right at the boundary aren't missed; seenOrderIds removes duplicates
            const windowStart = new Date(lastCheck.getTime() - 60 * 1000);

            try
            {
                let page = await fetchOrders({ modifiedAfter: windowStart.toISOString(), modifiedBefore: now.toISOString() });

                while(true)
                {
                    for(const order of page.result)
                    {
                        // modifiedAfter also returns old orders that were just edited (e.g. fulfilled), so only report new ones
                        if(seenOrderIds.has(order.id) || new Date(order.createdOn) < startedAt)
                        {
                            continue;
                        }

                        seenOrderIds.add(order.id);
                        onOrder(order);
                    }

                    if(!page.pagination || !page.pagination.hasNextPage)
                    {
                        break;
                    }

                    page = await fetchOrders({ cursor: page.pagination.nextPageCursor });
                }

                lastCheck = now;
            }
            catch(error)
            {
                console.error('Failed to poll Squarespace orders:', error);
            }
        }

        console.log(`Polling Squarespace for new orders every ${intervalSeconds}s`);
        poll();
        return setInterval(poll, intervalSeconds * 1000);
    }
}
