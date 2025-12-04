import https from 'node:https';
import http from 'node:http';
import { loginListeners, dietListeners, waterListeners, weightListeners } from './listeners.ts';
import { loginTracks, dietTracks, waterTracks, weightTracks, mealCompletionTrack } from './tracks.ts';
import { loginTriggers, dietCountTriggers, waterTriggers, weightTriggers, dietTrackTriggers } from './triggers.ts';
import { loginCount, loginStreak, dietCount, dietStreak, waterCount, waterStreak, weightLogCount } from './achievements.ts';

const jwt = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZDZlOTk2OC1iNGRiLTRiMzUtOGU2Ny03NTEzNDYzMmI5ZjkiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjQ4MTE4ODUsImV4cCI6MTc2NDg5ODI4NX0.OpQeuP0q7MQ_LplZ63oDSX44ZBU1a10KVfkn0zwpIEun8YQliM4upI7CSGA37AxeDNFcxWff_O8bnXcURoqUm_yL8FS-wZMlC6LD9naiCb5BMd_5aYcuz1NcCYvo5ECnw2zD8BGKxIOYlXl9NVNPka5pUB1TmVek58ePQ7PlmQ_hrJER2dFYZq5AU-Tc1Smj4YQyoRFrAJWMYFDkFxiBfX04lmVAWzsyfrFExexAiDObnnUkAi4Ucr4oLyWtu1vFOZrzqZFWljuMok_OHAv3PD2fTuLOh3G0_542HZk59flNR85YRYiSflOx2IwUj6u8C2JrzgKT92pwgEN7eWT-HA";

function postWithAuth(url: string, data: object): Promise<string> {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;

        const postData = JSON.stringify(data);

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'Authorization': `Bearer ${jwt}`
            }
        };

        const req = client.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                resolve(responseData);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

const listenersUrl = "http://localhost:8080/api/v1/game/listeners";
const tracksUrl = "http://localhost:8080/api/v1/game/tracks";
const triggersUrl = "http://localhost:8080/api/v1/game/triggers";
const achievementsUrl = "http://localhost:8080/api/v1/game/achievements";

async function createAchievementsForTrack(trackId: string, trackType: string, countAchievements: object[], streakAchievements: object[]) {
    const achievements = trackType === 'COUNTER' ? countAchievements : streakAchievements;

    for (const achievement of achievements) {
        const achievementWithTrackId = JSON.parse(
            JSON.stringify(achievement).replace('{{trackId}', trackId)
        );

        try {
            const response = await postWithAuth(achievementsUrl, achievementWithTrackId);
            console.log("Created achievement:", response);
        } catch (error) {
            console.error("Error creating achievement:", error);
        }
    }
}

async function createLoginGame() {
    const listenersId: string[] = [];
    for (const listener of loginListeners) {
        try {
            const response = await postWithAuth(listenersUrl, listener);
            console.log("Created login listener:", response);
            listenersId.push(JSON.parse(response).id);
        } catch (error) {
            console.error("Error creating login listener:", error);
        }
    }

    const tracksIds: string[] = [];
    for (const track of loginTracks) {
        try {
            const response = await postWithAuth(tracksUrl, track);
            console.log("Created login track:", response);
            const parsedResponse = JSON.parse(response);
            const trackId = parsedResponse.id;
            const trackType = parsedResponse.configuration?.type;
            tracksIds.push(trackId);

            if (trackType === 'COUNTER') {
                await createAchievementsForTrack(trackId, trackType, loginCount, loginStreak);
            } else if (trackType === 'STREAK') {
                await createAchievementsForTrack(trackId, trackType, loginCount, loginStreak);
            }
        } catch (error) {
            console.error("Error creating login track:", error);
        }
    }

    for (let trigger of loginTriggers) {
        for (const listenerId of listenersId) {
            for (const trackId of tracksIds) {
                const updatedTrigger = JSON.parse(JSON.stringify(trigger));
                updatedTrigger.listenerId = listenerId;
                updatedTrigger.trackId = trackId;
                try {
                    const response = await postWithAuth(triggersUrl, updatedTrigger);
                    console.log("Created login trigger:", response);
                } catch (error) {
                    console.error("Error creating login trigger:", error);
                }
            }
        }
    }
}

async function createDietGame() {
    const listenersId: string[] = [];
    for (const listener of dietListeners) {
        const response = await postWithAuth(listenersUrl, listener);
        listenersId.push(JSON.parse(response).id);
    }

    const tracksIds: { id: string, type: string }[] = [];
    for (const track of dietTracks) {
        const response = await postWithAuth(tracksUrl, track);
        const parsed = JSON.parse(response);
        tracksIds.push({ id: parsed.id, type: parsed.configuration?.type });
        await createAchievementsForTrack(parsed.id, parsed.configuration?.type, dietCount, dietStreak);
    }

    for (const listenerId of listenersId) {
        for (const track of tracksIds) {
            const triggersToUse = track.type === 'COUNTER' ? dietCountTriggers : dietTrackTriggers;
            for (const trig of triggersToUse) {
                const updated = JSON.parse(JSON.stringify(trig));
                updated.listenerId = listenerId;
                updated.trackId = track.id;
                await postWithAuth(triggersUrl, updated);
            }
        }
    }

    const mealCompletionCounter = await postWithAuth(tracksUrl, mealCompletionTrack);
    const mealCompletionParsed = JSON.parse(mealCompletionCounter);
    const mealCompletionTrackId = mealCompletionParsed.id;
    // await createAchievementsForTrack(mealCompletionTrackId, 'COUNTER', dietCount, []);
    await postWithAuth(triggersUrl, {
        "trackId": mealCompletionTrackId,
        "listenerId": listenersId[0],
        "conditions": [
            {
                "foundAt": "statusCode",
                "propertyType": "number",
                "conditionOperation": "EQUAL",
                "value": "201"
            },
            {
                "foundAt": "user",
                "mappedBy": "role",
                "propertyType": "string",
                "conditionOperation": "EQUAL",
                "value": "patient"
            },
            {
                "foundAt": "data",
                "mappedBy": "totalMealsForDay",
                "propertyType": "number",
                "conditionOperation": "GREATER_OR_EQUAL",
                "compare": {
                    "foundAt": "data",
                    "mappedBy": "completedMealsForDay"
                }
            },
            {
                "foundAt": "timestamp",
                "propertyType": "date",
                "conditionOperation": "GREATER_THAN",
                "applyOperationOnDate": "day",
                "compare": {
                    "foundAt": "trackRecord",
                    "mappedBy": "lastUpdatedAt"
                }
            }
        ]
    })

}

async function createWaterGame() {
    const listenersId: string[] = [];
    for (const listener of waterListeners) {
        try {
            const response = await postWithAuth(listenersUrl, listener);
            console.log("Created water listener:", response);
            listenersId.push(JSON.parse(response).id);
        } catch (error) {
            console.error("Error creating water listener:", error);
        }
    }

    const tracksIds: string[] = [];
    for (const track of waterTracks) {
        try {
            const response = await postWithAuth(tracksUrl, track);
            console.log("Created water track:", response);
            const parsedResponse = JSON.parse(response);
            const trackId = parsedResponse.id;
            const trackType = parsedResponse.configuration?.type;
            tracksIds.push(trackId);

            if (trackType === 'COUNTER') {
                await createAchievementsForTrack(trackId, trackType, waterCount, waterStreak);
            } else if (trackType === 'STREAK') {
                await createAchievementsForTrack(trackId, trackType, waterCount, waterStreak);
            }
        } catch (error) {
            console.error("Error creating water track:", error);
        }
        for (let trigger of waterTriggers) {
            for (const listenerId of listenersId) {
                for (const trackId of tracksIds) {
                    const updatedTrigger = JSON.parse(JSON.stringify(trigger));
                    updatedTrigger.listenerId = listenerId;
                    updatedTrigger.trackId = trackId;
                    try {
                        const response = await postWithAuth(triggersUrl, updatedTrigger);
                        console.log("Created water trigger:", response);
                    } catch (error) {
                        console.error("Error creating water trigger:", error);
                    }
                }
            }
        }
    }

}

async function createWeightGame() {
    const listenersId: string[] = [];
    for (const listener of weightListeners) {
        try {
            const response = await postWithAuth(listenersUrl, listener);
            console.log("Created weight listener:", response);
            listenersId.push(JSON.parse(response).id);
        } catch (error) {
            console.error("Error creating weight listener:", error);
        }
    }

    const tracksIds: string[] = [];
    for (const track of weightTracks) {
        try {
            const response = await postWithAuth(tracksUrl, track);
            console.log("Created weight track:", response);
            const parsedResponse = JSON.parse(response);
            const trackId = parsedResponse.id;
            const trackType = parsedResponse.configuration?.type;
            tracksIds.push(trackId);

            // Weight only has count achievements (weightLogCount), no streak
            if (trackType === 'COUNTER') {
                await createAchievementsForTrack(trackId, trackType, weightLogCount, []);
            }
        } catch (error) {
            console.error("Error creating weight track:", error);
            for (let trigger of weightTriggers) {
                for (const listenerId of listenersId) {
                    for (const trackId of tracksIds) {
                        const updatedTrigger = JSON.parse(JSON.stringify(trigger));
                        updatedTrigger.listenerId = listenerId;
                        updatedTrigger.trackId = trackId;
                        try {
                            const response = await postWithAuth(triggersUrl, updatedTrigger);
                            console.log("Created weight trigger:", response);
                        } catch (error) {
                            console.error("Error creating weight trigger:", error);
                        }
                    }
                }
            }
        }
    }
}


async function main() {
    await createLoginGame();
    await createDietGame();
    await createWaterGame();
    await createWeightGame();
}

main();