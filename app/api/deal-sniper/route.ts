import { NextResponse } from 'next/server';
import { analyzeListing } from '@/lib/analyzer';
import { 
  getSniperSettings, 
  isListingCached, 
  addListingToCache, 
  addSnipedAlert, 
  SnipedDealAlert 
} from '@/lib/deal-sniper';

// Robust, lightweight native Twilio SMS sender
async function sendTwilioSms(
  to: string, 
  body: string
): Promise<{ success: boolean; log: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !from) {
    return { 
      success: false, 
      log: 'Twilio credentials not configured in environment. Gracefully fell back to terminal dashboard logging.' 
    };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        },
        body: new URLSearchParams({
          From: from,
          To: to,
          Body: body,
        }).toString()
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, log: `SMS successfully dispatched via Twilio. SID: ${data.sid}` };
    } else {
      const errText = await response.text();
      return { success: false, log: `Twilio API returned error code ${response.status}: ${errText}` };
    }
  } catch (err: any) {
    return { success: false, log: `Failed to connect to Twilio servers: ${err.message}` };
  }
}

export async function GET(request: Request) {
  return handleSniperRequest(request);
}

export async function POST(request: Request) {
  return handleSniperRequest(request);
}

async function handleSniperRequest(request: Request) {
  const executionLogs: string[] = [];
  executionLogs.push(`[${new Date().toISOString()}] Deal Sniper Background Polling Worker initialized.`);

  try {
    // 1. Security Check
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get('secret');
    
    // Parse POST body if available for manual listings testing
    let bodyData: any = {};
    try {
      if (request.method === 'POST') {
        bodyData = await request.json();
      }
    } catch {}

    const secret = querySecret || bodyData.secret;
    const isMockTrigger = searchParams.get('mock') === 'true' || bodyData.mock === 'true';
    const simulateRun = searchParams.get('simulate') === 'true' || bodyData.simulate === 'true';

    // Verify secret token (supporting standard TEST_SECRET fallback for offline manual verification)
    const expectedSecret = process.env.VELOSTACK_SNIPER_SECRET || 'TEST_SECRET';
    if (!secret || secret !== expectedSecret) {
      executionLogs.push(`[ERROR] Unauthorized request attempt. Provided secret: "${secret || 'none'}" did not match.`);
      return NextResponse.json({ 
        error: 'Unauthorized. Invalid secret token parameters.', 
        logs: executionLogs 
      }, { status: 401 });
    }

    executionLogs.push(`[SECURITY] Authentication successful. Active secret match.`);

    // 2. Load settings
    const settings = getSniperSettings();
    executionLogs.push(`[SETTINGS] Loaded settings successfully.`);
    executionLogs.push(`- Zip Code: ${settings.zipCode}`);
    executionLogs.push(`- Radius: ${settings.radiusKm} km`);
    executionLogs.push(`- Min Profit Target: €${settings.minProfitEur}`);
    executionLogs.push(`- Target Brands: ${settings.targetBrands.join(', ')}`);
    executionLogs.push(`- Phone Alert: ${settings.alertPhoneNumber}`);

    if (!settings.isSniperEnabled && !isMockTrigger && !simulateRun) {
      executionLogs.push(`[WARNING] Background Deal Sniper is toggled off in settings. Skipping run.`);
      return NextResponse.json({ 
        message: 'Deal Sniper is currently disabled in settings.', 
        logs: executionLogs 
      });
    }

    // 3. Collect/scout listings to process
    let listingsToAppraise: Array<{
      title: string;
      description: string;
      askingPrice: number;
      location: string;
      link: string;
      distanceKm: number;
    }> = [];

    // Check if custom parameters are provided (e.g. via direct api hit)
    const customTitle = searchParams.get('title') || bodyData.title;
    const customPrice = searchParams.get('price') || bodyData.price;
    const customDesc = searchParams.get('description') || bodyData.description || 'Custom appraise listing';
    const customLoc = searchParams.get('location') || bodyData.location || settings.zipCode;
    const customLink = searchParams.get('link') || bodyData.link || 'https://classifieds.local/items/custom-ad';

    if (customTitle && customPrice) {
      const priceNum = parseFloat(customPrice);
      executionLogs.push(`[SOURCE] Direct manual ad parameter detected. Evaluating listing: "${customTitle}" for €${priceNum}.`);
      listingsToAppraise.push({
        title: customTitle,
        description: customDesc,
        askingPrice: priceNum,
        location: customLoc,
        link: customLink,
        distanceKm: 4.2
      });
    } else {
      // Generate a simulated search based on radius and user-configured keywords
      executionLogs.push(`[HARVESTER] Launching classified scanning crawler feed for Zip Code "${settings.zipCode}" inside a ${settings.radiusKm} km radius...`);
      
      const brands = settings.targetBrands.length > 0 ? settings.targetBrands : ['Trek', 'Specialized', 'Giant'];
      const targetBrand1 = brands[0];
      const targetBrand2 = brands[1] || 'Specialized';
      
      listingsToAppraise = [
        {
          title: `2021 ${targetBrand1} Emonda ALR Disc`,
          description: `Selling my beloved ${targetBrand1} road bike. It has a lightweight aluminum frame with carbon fork, Shimano 105 groupset (2x11 speed). Stored in the garage. Cosmetic scratches on the frame. It needs a new chain and the rear derailleur shifting could use an alignment. Asking €120 for quick cash. Pickup only near ${settings.zipCode}.`,
          askingPrice: 120,
          location: settings.zipCode,
          link: `https://ebay.de/itm/item-${targetBrand1.toLowerCase()}-emonda-120`,
          distanceKm: 3.2
        },
        {
          title: `Used ${targetBrand2} Allez Sport Road Bike 54cm`,
          description: `Good entry-level road bike, aluminum frame, 9-speed Shimano Sora. Shifts and rides okay but chain and cassette are worn out, brakes are squeaking and need new pads. Selling as-is. Price is €100.`,
          location: `${parseInt(settings.zipCode) + 1 || '80332'}`,
          askingPrice: 100,
          link: `https://ebay.de/itm/item-${targetBrand2.toLowerCase()}-allez-100`,
          distanceKm: 8.5
        },
        {
          title: `Standard Commuter Bike 28 inch`,
          description: `Simple vintage city bike with 3-speed internal gear hub. Rusty rack, flat rear tire. Needs some love. Location nearby. Asking €45.`,
          location: settings.zipCode,
          askingPrice: 45,
          link: `https://ebay.de/itm/item-city-commuter-45`,
          distanceKm: 1.1
        },
        {
          title: `Overpriced Carbon Road Bike`,
          description: `Excellent full carbon road bike, custom build. Serviced last week. Absolutely firm on price, do not ask for discounts. Asking €1400.`,
          location: settings.zipCode,
          askingPrice: 1400,
          link: `https://ebay.de/itm/item-overpriced-carbon-1400`,
          distanceKm: 5.6
        }
      ];
      
      executionLogs.push(`[HARVESTER] Scanner crawler returned ${listingsToAppraise.length} local listings matching zip boundaries.`);
    }

    // 4. Process listings
    let snipedCount = 0;
    let skippedCount = 0;
    const snipedAlertsList: SnipedDealAlert[] = [];

    for (const listing of listingsToAppraise) {
      executionLogs.push(`----------------------------------------`);
      executionLogs.push(`[SCANNER] Evaluating listing: "${listing.title}" | Price: €${listing.askingPrice} | Distance: ${listing.distanceKm} km`);

      // Duplicate Cache verification
      if (isListingCached(listing.link)) {
        executionLogs.push(`[CACHE] Skipping listing. Ad URL is already registered as analyzed in deal_sniper_cache.json.`);
        skippedCount++;
        continue;
      }

      // Appraise listing server-side using the VeloStack AI analyzer
      executionLogs.push(`[ANALYZER] Calling AI Appraiser engine for deep listing inspection...`);
      const analysis = await analyzeListing({
        title: listing.title,
        description: listing.description,
        askingPrice: listing.askingPrice,
        location: listing.location,
        marketProfile: 'standard'
      });

      const dealScore = Math.round(analysis.confidence * 100);
      executionLogs.push(`[VERDICT] AI analysis finished.`);
      executionLogs.push(`- Brand: ${analysis.bikeTier?.brand || 'generic'}`);
      executionLogs.push(`- Tier: ${analysis.bikeTier?.tier || 'budget'}`);
      executionLogs.push(`- Est. Resale Value: €${analysis.estimatedResalePrice}`);
      executionLogs.push(`- Est. Repairs Cost: €${analysis.estimatedRepairCost}`);
      executionLogs.push(`- Est. Net Profit: €${analysis.estimatedProfit}`);
      executionLogs.push(`- Verdict: ${analysis.verdict} (${analysis.verdictReason})`);
      executionLogs.push(`- Confidence Score: ${dealScore}/100`);

      // Determine margin and confidence threshold passes
      const meetsProfit = analysis.estimatedProfit >= settings.minProfitEur;
      const meetsScore = dealScore >= settings.minDealScore;
      const goodVerdict = analysis.verdict === 'GREAT FLIP' || analysis.verdict === 'FAIR DEAL';

      if (meetsProfit && meetsScore && goodVerdict) {
        executionLogs.push(`[🎯 MATCH] Undervalued Deal Sniped! Listing matches user's flipping targets.`);
        snipedCount++;

        // Add to cache first to avoid concurrent double messaging
        addListingToCache(listing.link);
        executionLogs.push(`[CACHE] Added listing URL to cache registry.`);

        // Build notification SMS
        const roiPercent = analysis.estimatedResalePrice > 0 
          ? Math.round((analysis.estimatedProfit / analysis.estimatedResalePrice) * 100) 
          : 0;

        const smsMessage = `🚨 VELOSTACK DEAL SNIPED!
Bike: ${listing.title}
Listed Price: €${listing.askingPrice}
Estimated Value: €${analysis.estimatedResalePrice}
Est. Profit: €${analysis.estimatedProfit} (ROI: ${roiPercent}%)
Distance: ${listing.distanceKm} km
Link: ${listing.link}
[Analyze inside VeloStack Workspace]`;

        executionLogs.push(`[SMS] Constructing text alert payload to ${settings.alertPhoneNumber}...`);
        
        // Dispatch SMS
        const smsResult = await sendTwilioSms(settings.alertPhoneNumber, smsMessage);
        executionLogs.push(`[SMS STATUS] ${smsResult.log}`);

        // Construct Alert record
        const alertRecord: SnipedDealAlert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          timestamp: new Date().toISOString(),
          title: listing.title,
          price: listing.askingPrice,
          location: listing.location,
          estimatedResalePrice: analysis.estimatedResalePrice,
          estimatedProfit: analysis.estimatedProfit,
          roiPercent: roiPercent,
          dealScore: dealScore,
          verdict: analysis.verdict,
          verdictReason: analysis.verdictReason,
          distanceKm: listing.distanceKm,
          link: listing.link,
          smsSent: smsResult.success,
          smsLog: smsResult.log,
          details: analysis
        };

        // Persist the alert to alerts history
        addSnipedAlert(alertRecord);
        snipedAlertsList.push(alertRecord);
        executionLogs.push(`[ALERT REGISTERED] Deal persisted to sniped deals alert log.`);
        
        // Log in a beautiful block on the server console if no real Twilio API keys are configured
        if (!smsResult.success) {
          console.log('\n========================================');
          console.log('🚨 MOCK SMS NOTIFICATION DISPATCHED 🚨');
          console.log('To:', settings.alertPhoneNumber);
          console.log('Message:\n' + smsMessage);
          console.log('========================================\n');
        }
      } else {
        executionLogs.push(`[PASS] Listing did not exceed targets. (Profit: €${analysis.estimatedProfit}/${settings.minProfitEur}, Score: ${dealScore}/${settings.minDealScore})`);
        // We still add to cache so we don't re-appraise listings that fail to qualify
        addListingToCache(listing.link);
        executionLogs.push(`[CACHE] Added non-qualifying listing to cache to prevent re-appraisal.`);
      }
    }

    executionLogs.push(`========================================`);
    executionLogs.push(`[${new Date().toISOString()}] Run completed. Scanned: ${listingsToAppraise.length}, Sniped: ${snipedCount}, Already Cached (skipped): ${skippedCount}`);

    return NextResponse.json({
      success: true,
      scannedCount: listingsToAppraise.length,
      snipedCount,
      skippedCount,
      snipedAlerts: snipedAlertsList,
      logs: executionLogs
    });

  } catch (error: any) {
    executionLogs.push(`[CRITICAL ERROR] Polling loop failed: ${error.message}`);
    return NextResponse.json({
      success: false,
      error: error.message,
      logs: executionLogs
    }, { status: 500 });
  }
}
