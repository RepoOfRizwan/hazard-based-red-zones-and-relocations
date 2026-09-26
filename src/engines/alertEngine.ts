import { AlertNotification, Habitation } from '../types';

export class AlertEngine {
  /**
   * Generates simulated multi-channel disaster notifications (SMS, WhatsApp, NDMA Sachet CAP format)
   * when habitations trigger Red/Amber Zone emergency thresholds.
   * Dynamically differentiates between FLOOD WARNINGS and LANDSLIDE WARNINGS.
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

    const hazardType = hab.hazard_alert_type || (hab.dominant_hazard === 'FLOOD' ? 'FLASH FLOOD & INUNDATION' : 'DEBRIS FLOW & LANDSLIDE');
    const dominant = hab.dominant_hazard || 'LANDSLIDE';

    const headline = isRed
      ? `CRITICAL RED ZONE [${dominant}]: Immediate Relocation Mandated for ${hab.name}`
      : `AMBER ZONE [${dominant} ADVISORY]: Heightened Surveillance for ${hab.name}`;

    const hazardCause = dominant === 'FLOOD'
      ? `river embankment overtopping and severe low-lying inundation`
      : `sudden regolith slope failure and debris torrent`;

    const description = `Habitation ${hab.name} (${hab.taluk} Taluk, ${hab.district}) has crossed emergency risk threshold with a score of ${hab.risk_score}/100 under heavy monsoon precipitation (${hab.rainfall_mm}mm). High susceptibility to ${hazardCause}. ${
      vuln.elderly_65 + vuln.pwd + vuln.medically_dependent
    } vulnerable residents need priority convoy evacuation.`;

    const recommendedAction = `Initiate immediate tactical evacuation of ${hab.population.total} residents. Primary assembly point: ${hab.name} High Ground / Junction. Designated destination: ${shelterName} (${distKm} km). Access route: ${infra.access_route_name}. Avoid flooded low-lying culverts and erosion zones.`;

    const smsPreview = `🚨 [NDRF/SDMA FLASH ALERT] ${hab.risk_zone} ZONE [${dominant}]: ${hab.name} (Risk: ${hab.risk_score}/100). Mandatory relocation: Proceed to ${shelterName} (${distKm}km) via ${infra.access_route_name}. Priority assistance active for elderly/PwD. Control Room: 1077 / 112.`;

    const whatsappPreview = `🔴 *MHA / NDRF CONTROL ROOM EMERGENCY DISPATCH*
*Time:* ${nowStr} IST
*Location:* ${hab.name}, ${hab.taluk} Taluk, ${hab.district}
*Threat Type:* ${hazardType}
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

📞 *EMERGENCY DISPATCH:*
• District Disaster Control: 1077
• Police / NDRF Emergency: 112`;

    const capXmlPreview = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${alertId}</identifier>
  <sender>NDRF-MHA-DM-CONTROL@gov.in</sender>
  <sent>${timestampIso}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Safety</category>
    <event>${hazardType}</event>
    <urgency>Immediate</urgency>
    <severity>${severity}</severity>
    <certainty>Observed</certainty>
    <headline>${headline}</headline>
    <description>${description}</description>
    <instruction>${recommendedAction}</instruction>
    <area>
      <areaDesc>${hab.name}, ${hab.taluk}, ${hab.district}</areaDesc>
      <circle>${hab.coordinates[0]},${hab.coordinates[1]},2.0</circle>
    </area>
  </info>
</alert>`;

    return {
      id: alertId,
      habitation_id: hab.id,
      habitation_name: hab.name,
      timestamp: nowStr,
      severity,
      dominant_hazard: dominant,
      hazard_alert_type: hazardType,
      headline,
      description,
      recommendedAction,
      sms_preview: smsPreview,
      whatsapp_preview: whatsappPreview,
      cap_xml_preview: capXmlPreview,
    };
  }
}
