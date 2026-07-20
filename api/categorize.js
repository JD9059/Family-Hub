import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { itemText, listType } = req.body;

        const prompt = `
            You are a smart family hub assistant. Parse and categorize user input for a "${listType}" list.
            Input text: "${itemText}"
            List type: "${listType}"

            Key Family Context:
            - "Cola" is the family dog (a Labrador Retriever). Any item for "Cola" or mentioning dog supplies (leash, kibble, dog treats, harness, waste bags, dog toys, dog bowl) is dog-related.
            - Name variations: "Cola", "Cola's", "Colas", and "Colas'" all refer to the dog.
            - Family Members: 
                - Mentioning "kid", "kids", or specific children's names should tag items under "🎒 Kids' Supplies" or "🧒 Kids".
                - If an item specifies a name (e.g., "Dad's sandals" or "Mom's sunscreen"), keep the owner's name in the cleaned title.

            Rules:
            1. Extract distinct items if multiple items are mentioned in one line.
            2. Clean up item labels to be concise and title-cased.
            3. Dynamically assign a clean, emoji-prefixed category name to each item based on list context.
               - For grocery list: "🥦 Produce", "🥛 Dairy & Eggs", "🍞 Bakery & Grains", "🥩 Meat & Seafood", "📦 Pantry & Snacks", etc.
               - For beach list: "🕶️ Beach Gear", "🩲 Swim & Apparel", "🍹 Food & Drinks", "🐶 Cola's Essentials", "☀️ Sun & Safety", etc.

            Respond ONLY with a valid JSON object:
            {"items": [{"text": "Cleaned Item Name", "category": "Emoji Category Name"}]}
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You output only clean JSON blocks without markdown formatting." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const rawJson = JSON.parse(response.choices[0].message.content.trim());
        const items = rawJson.items || (Array.isArray(rawJson) ? rawJson : Object.values(rawJson)[0]);

        return res.status(200).json({ items });
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return res.status(500).json({ error: 'Failed to process item with AI' });
    }
}
