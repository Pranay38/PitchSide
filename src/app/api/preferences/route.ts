import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../server/_db";
import { sanitizeString } from "../../../../server/utils/security";

const COLLECTION = "subscribers";

function isValidEmail(email: string): boolean {
    return email.includes("@") && email.includes(".");
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const rawEmail = searchParams.get("email");
    const email = sanitizeString(rawEmail);
    const normalizedEmail = email && isValidEmail(email) ? email.trim().toLowerCase() : null;

    if (!normalizedEmail) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    try {
        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);
        const subscriber = await collection.findOne({ email: normalizedEmail });

        if (!subscriber) {
            return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
        }

        const isUnsubscribed = subscriber.status === "unsubscribed";

        return NextResponse.json({
            preferences: {
                digest: !isUnsubscribed && subscriber.preferences?.digest !== false,
                newArticles: !isUnsubscribed && subscriber.preferences?.newArticles !== false,
                productUpdates: !isUnsubscribed && subscriber.preferences?.productUpdates === true,
                unsubscribed: isUnsubscribed,
            }
        }, { status: 200 });
    } catch (error: any) {
        console.error("Preferences GET Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const rawEmail = body.email;
        const preferences = body.preferences;
        const email = sanitizeString(rawEmail);
        const normalizedEmail = email && isValidEmail(email) ? email.trim().toLowerCase() : null;

        if (!normalizedEmail) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }

        if (!preferences) {
            return NextResponse.json({ error: "Missing preferences payload" }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection(COLLECTION);
        
        const existing = await collection.findOne({ email: normalizedEmail });
        
        if (!existing) {
            return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
        }

        const updateData: any = {
            updatedAt: new Date().toISOString(),
            preferences: {
                digest: !!preferences.digest,
                newArticles: !!preferences.newArticles,
                productUpdates: !!preferences.productUpdates,
            }
        };

        if (preferences.unsubscribed) {
            updateData.status = "unsubscribed";
            // If they are unsubscribing entirely, force all other preferences to false just to be clean
            updateData.preferences.digest = false;
            updateData.preferences.newArticles = false;
            updateData.preferences.productUpdates = false;
        } else {
            updateData.status = "active";
        }

        await collection.updateOne(
            { email: normalizedEmail },
            { $set: updateData }
        );

        return NextResponse.json({ message: "Preferences updated successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Preferences POST Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
