import React from 'react';
import { Globe, Eye, ShieldAlert } from 'lucide-react';
import { KPICard, Panel, ExportButton } from './rcShared';

export default function RCIpRisk({ accounts, deviceLogs, onView }) {
  // Group IPs by address
  const ipMap = {};
  (deviceLogs || []).forEach(d => {
    if (!ipMap[d.ip_address]) ipMap[d.ip_address] = { ip: d.ip_address, users: new Set(), logs: [], vpn: false, proxy: false, dc: false, countries: new Set(), lastSeen: null };
    ipMap[d.ip_address].users.add(d.user_email);
    ipMap[d.ip_address].logs.push(d);
    if (d.is_vpn) ipMap[d.ip_address].vpn = true;
    if (d.is_proxy) ipMap[d.ip_address].proxy = true;
    if (d.is_datacenter) ipMap[d.ip_address].dc = true;
    if (d.country_from_ip) ipMap[d.ip_address].countries.add(d.country_from_ip);
    const ll = d.last_login ? new Date(d.last_login) : null;
    if (ll && (!ipMap[d.ip_address].lastSeen || ll > ipMap[d.ip_address].lastSeen)) ipMap[d.ip_address].lastSeen = ll;
  });

  const ipList = Object.values(ipMap).map(ip => ({
    ...ip,
    userCount: ip.users.size,
    userList: [...ip.users],
    countries: [...ip.countries],
  })).sort((a, b) => b.userCount - a.userCount);

  // Shared IPs (multiple accounts)
  const sharedIps = ipList.filter(ip => ip.userCount > 1);
  // VPN/Proxy/DC
  const riskyIps = ipList.filter(ip => ip.vpn || ip.proxy || ip.dc);

  const exportData = ipList.map(ip => ({
    ip: ip.ip, users: ip.userCount, vpn: ip.vpn, proxy: ip.proxy, datacenter: ip.dc,
    countries: ip.countries.join(';'), last_seen: ip.lastSeen?.toISOString(),
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Unique IPs" value={ipList.length} icon={Globe} color="#60a5fa" />
        <KPICard label="Shared IPs" value={sharedIps.length} sub="multi-account" icon={ShieldAlert} color="#ef4444" />
        <KPICard label="VPN/Proxy" value={riskyIps.length} icon={ShieldAlert} color="#f59e0b" />
        <KPICard label="Datacenter" value={ipList.filter(ip => ip.dc).length} icon={ShieldAlert} color="#dc2626" />
      </div>

      {sharedIps.length > 0 && (
        <Panel title="Shared IPs - Multiple Accounts" icon={ShieldAlert}>
          <div className="space-y-2">
            {sharedIps.map(ip => (
              <div key={ip.ip} className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-white font-bold">{ip.ip}</span>
                  <span className="text-[10px] text-red-400 font-bold">{ip.userCount} accounts</span>
                </div>
                <div className="text-[10px] text-white/50">{ip.userList.join(', ')}</div>
                {ip.countries.length > 0 && <div className="text-[10px] text-white/30 mt-1">Countries: {ip.countries.join(', ')}</div>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="All IP Addresses" icon={Globe} action={<ExportButton data={exportData} filename="ip_risk.csv" />}>
        {ipList.length === 0 ? (
          <p className="text-xs text-white/30 py-6 text-center">No device logs recorded for monitored accounts.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  {['IP Address', 'Users', 'Country', 'Flags', 'Last Seen', ''].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] font-mono text-white/30 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ipList.slice(0, 50).map(ip => (
                  <tr key={ip.ip} className="border-b hover:bg-white/[0.02]" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                    <td className="py-2.5 px-3 text-xs font-mono text-white/70">{ip.ip}</td>
                    <td className="py-2.5 px-3 text-xs text-white/60 tabular">{ip.userCount}</td>
                    <td className="py-2.5 px-3 text-xs text-white/50">{ip.countries.join(', ') || '-'}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-1 flex-wrap">
                        {ip.vpn && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: '#ef4444' }}>VPN</span>}
                        {ip.proxy && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: '#f59e0b' }}>PROXY</span>}
                        {ip.dc && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ background: '#7f1d1d' }}>DC</span>}
                        {!ip.vpn && !ip.proxy && !ip.dc && <span className="text-[9px] text-white/20">clean</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-white/30">{ip.lastSeen ? ip.lastSeen.toLocaleString() : '-'}</td>
                    <td className="py-2.5 px-3">
                      {ip.userCount > 1 && <ShieldAlert className="w-4 h-4 text-red-400" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}