import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import dns from 'node:dns';

const dnsResolveTxt = dns.promises.resolveTxt;

export async function POST(req: Request) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const id = parts[2];
  const body = await req.json().catch(() => ({}));
  const action = body.action || 'start';

  if (action === 'start') {
    const domain = (body.domain || '').trim().toLowerCase();
    if (!domain) return NextResponse.json({ error: 'domain-required' }, { status: 400 });

    const token = `myapp-verify-${Math.random().toString(36).slice(2, 10)}`;
    await prisma.business.update({ where: { id }, data: { customDomain: domain, customDomainVerified: false } });
    // store token in a PlatformSetting for simplicity
    await prisma.platformSetting.upsert({ where: { key: `domain-verify-${id}` }, update: { value: token }, create: { key: `domain-verify-${id}`, value: token } });

    return NextResponse.json({ message: 'created', token, instruction: `Create a TXT record for _myapp-verify.${domain} with value ${token}` });
  }

  if (action === 'verify') {
    const domain = (body.domain || '').trim().toLowerCase();
    if (!domain) return NextResponse.json({ error: 'domain-required' }, { status: 400 });

    const recordKey = `domain-verify-${id}`;
    const setting = await prisma.platformSetting.findUnique({ where: { key: recordKey } });
    if (!setting) return NextResponse.json({ error: 'no-token' }, { status: 400 });
    const token = setting.value;

    try {
      const txts = await dnsResolveTxt(`_myapp-verify.${domain}`);
      const flat = txts.flat().map(String);
      if (flat.includes(token)) {
        await prisma.business.update({ where: { id }, data: { customDomainVerified: true } });
        return NextResponse.json({ verified: true });
      }
      return NextResponse.json({ verified: false, found: flat });
    } catch (err) {
      return NextResponse.json({ error: 'dns-error', details: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'invalid-action' }, { status: 400 });
}
