import { NextResponse } from 'next/server';
import { 
  getSniperSettings, 
  saveSniperSettings, 
  getSnipedAlerts, 
  clearSniperCache, 
  clearSnipedAlerts,
  addSnipedAlert
} from '@/lib/deal-sniper';

export async function GET() {
  try {
    const settings = getSniperSettings();
    const alerts = getSnipedAlerts();
    return NextResponse.json({ settings, alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch settings/alerts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'save-settings') {
      if (!body.settings) {
        return NextResponse.json({ error: 'Missing settings payload' }, { status: 400 });
      }
      saveSniperSettings(body.settings);
      return NextResponse.json({ success: true, settings: body.settings });
    }

    if (action === 'clear-cache') {
      clearSniperCache();
      return NextResponse.json({ success: true, message: 'Sniper duplicate cache cleared' });
    }

    if (action === 'clear-alerts') {
      clearSnipedAlerts();
      return NextResponse.json({ success: true, message: 'Sniper alerts history cleared' });
    }

    if (action === 'add-mock-alert') {
      if (!body.alert) {
        return NextResponse.json({ error: 'Missing alert payload' }, { status: 400 });
      }
      addSnipedAlert(body.alert);
      return NextResponse.json({ success: true, alert: body.alert });
    }

    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Action execution failed' }, { status: 500 });
  }
}
