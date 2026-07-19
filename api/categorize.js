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
            You are a smart family hub assistant. Parse and categorize the user input for a "${listType}" list.
            Input text: "${itemText}"

            Rules:
            1. Extract distinct items if multiple items are mentioned in one line.
            2. For each item, refine the label to be clean and title-case (e.g., "get some lowfat milk" -> "Lowfat Milk", "Cola's leash and harness" -> "Leash & Harness").
            3. Choose the best matching category from this list based on listType:

            If listType is "grocery":
            - "produce": Fruits, vegetables, herbs, fresh salads
            - "dairy": Milk, eggs, cheese, butter, yogurt, cream
            - "bakery": Bread, bagels, tortillas, buns, muffins
            - "grocery-other": Everything else

            If listType is "beach":
            - "gear": Beach towels, chairs, umbrellas, coolers, wagons, toys, speakers
            - "clothing": Swimsuits, trunks, flip flops, hats, sunglasses, hoodies for lake nights
            - "food": Snacks, drinks, water, s'mores ingredients, hot dogs, seltzers, ice
            - "cola": Anything related to Cola the dog (leash, kibble, dog treats, bowls, toys)
            - "beach-other": Everything else

            Respond ONLY with a JSON object structured like this:
            {"items": [{"text": "Cleaned Item Name", "category": "category-key"}]}
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
        const items = rawJson.items || Array.isArray(rawJson) ? rawJson : Object.values(rawJson)[0];

        return res.status(200).json({ items });
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return res.status(500).json({ error: 'Failed to process item with AI' });
    }
}
