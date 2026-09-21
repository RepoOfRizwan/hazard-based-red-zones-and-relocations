import { AlertNotification, Habitation } from '../types';

export class AlertEngine {
  /**
   * Generates simulated multi-channel disaster notifications (SMS, WhatsApp, NDMA Sachet CAP format)
   * when habitations trigger Red/Amber Zone emergency thresholds.
   */
  public static generateAlert(hab: Habitation): AlertNotification {
    const dateNow = new Date();
    const nowStr = dateNow.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const timestampIso = dateNow.toISOString();
    const alertId = `ALERT-NDRF-${hab.id}-${Date.now().toString().slice(-6)}`;

    const vuln = hab.population;
    const infra = hab.infrastructure;
    const shelterName = hab.assigned_shelter_name || 'Designated District Relief Camp';
    const distKm = hab.distance_to_shelter_km || 3.2;
    const isRed = hab.risk_zone === 'RED';
    const severity = isRed ? 'CRITICAL' : hab.risk_zone === 'AMBER' ? 'WARNING' : 'ADVISORY';

    const headline = isRed
      ? `CRITICAL RED ZONE ALERT: Immediate Relocation Mandated for ${hab.name}`
      : `AMBER ZONE ADVISORY: Heightened Flood/Slide Vigilance for ${hab.name}`;

    const description = `Habitation ${hab.name} (${hab.taluk} Taluk, Wayanad) has crossed hazard risk threshold with a score of ${hab.risk_score}/100 under monsoon precipitation (${hab.rainfall_mm}mm). High susceptibility to debris torrent and slope failure. ${
      vuln.elderly_65 + vuln.pwd + vuln.medically_dependent
    } vulnerable residents need priority convoy evacuation.`;

    const recommendedAction = `Initiate immediate tactical evacuation of ${hab.population.total} residents. Primary assembly point: ${hab.name} Junction. Designated destination: ${shelterName} (${distKm} km). Access route: ${infra.access_route_name}. Avoid flooded low-lying culverts.`;

    const smsPreview = `🚨 [NDRF/SDMA FLASH ALERT] ${hab.risk_zone} ZONE: ${hab.name} (Risk: ${hab.risk_score}/100). Evacuation: Move to ${shelterName} (${distKm}km) via ${infra.access_route_name}. Priority assistance for elderly/disabled. Emergency Control Room: 1077 / 112.`;

    const whatsappPreview = `🔴 *MHA / NDRF & KSDMA CONTROL ROOM EMERGENCY DISPATCH*
*Time:* ${nowStr} IST
*Location:* ${hab.name}, ${hab.taluk} Taluk, Wayanad District
*Hazard Level:* ${severity} ${hab.risk_zone} ZONE (Risk Score: ${hab.risk_score}/100)
*Recorded Rainfall:* ${hab.rainfall_mm} mm

⚠️ *VULNERABILITY AUDIT:*
• Total Habitation Population: ${hab.population.total} (${hab.population.households} households)
• Priority Care (Elderly/Infants/PwD/Medical): ${vuln.elderly_65 + vuln.infants_5 + vuln.pwd + vuln.medically_dependent}
• Evacuation Priority Index (EPI): ${hab.priority_score}/100 (Rank #${hab.priority_rank})

🏛️ *DESIGNATED RELOCATION SHELTER:*
• Facility: ${shelterName}
• Geodesic Distance: ${distKm} km
• Primary Transit Route: ${infra.access_route_name} ${infra.bridge_washout_risk ? '⚠️ [BRIDGE WASHOUT RISK: PROCEED WITH CAUTION]' : ''}

📞 *EMERGENCY ASSISTANCE:*
• District Disaster Control: 1077
• Police / NDRF Emergency: 112`;

    const capXmlPreview = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${alertId}</identifier>
  <sender>NDRF-HQ-DISASTER-OPS@ndma.gov.in</sender>
  <sent>${timestampIso}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Geo</category>
    <category>Met</category>
    <event>Landslide & Debris Flow Red Zone</event>
    <urgency>${isRed ? 'Immediate' : 'Expected'}</urgency>
    <severity>${isRed ? 'Extreme' : 'Severe'}</severity>
    <certainty>Observed</certainty>
    <headline>${headline}</headline>
    <description>${description}</description>
    <instruction>${recommendedAction}</instruction>
    <area>
      <areaDesc>${hab.name}, ${hab.taluk} Taluk, Wayanad, Kerala</areaDesc>
      <circle>${hab.coordinates[0]},${hab.coordinates[1]},1.5</circle>
    </area>
  </info>
</alert>`;

    return {
      id: alertId,
      habitation_id: hab.id,
      habitation_name: hab.name,
      timestamp: nowStr,
      severity,
      headline,
      description,
      recommended_action: recommendedAction,
      sms_preview: smsPreview,
      whatsapp_preview: whatsappPreview,
      cap_xml_preview: capXmlPreview,
    };
  }
}
