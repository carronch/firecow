import React, { useState } from 'react';
import { Copy, ShieldCheck, Mail, Phone, Video } from 'lucide-react';

export default function GbpLaunchKit({ site }: { site: any }) {
    const [copied, setCopied] = useState(false);

    const schema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": site.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        "image": `${site.domain ? `https://${site.domain}` : `https://${site.slug}.pages.dev`}/hero.jpg`,
        "url": site.domain ? `https://${site.domain}` : `https://${site.slug}.pages.dev`,
        "telephone": site.twilio_number || "PENDING TWILIO NUMBER",
        "address": {
            "@type": "PostalAddress",
            "addressRegion": "Local Region",
            "addressCountry": "CR"
        }
    };

    const copySchema = () => {
        navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-900 border-2 border-emerald-500 rounded-xl p-6 shadow-2xl w-full max-h-[85vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                <ShieldCheck className="text-emerald-500" />
                Google Business Profile (GBP) Launch Kit
            </h2>
            <p className="text-sm text-slate-400 mb-6">Never use the Google API to auto-create profiles. Give this exact data payload to your human worker for manual copy/pasting to guarantee instant algorithmic verification.</p>

            <div className="space-y-6">
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><Mail size={16} className="text-blue-400"/> 1. Domain Registration Email</h3>
                    <p className="text-sm text-slate-300">You must register the GBP account using <code className="text-blue-300 font-mono text-xs">info@{site.domain || `${site.slug}.com`}</code>. This proves domain ownership instantly.</p>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><Phone size={16} className="text-green-400"/> 2. Verified Twilio Number</h3>
                    <p className="text-sm text-slate-300">Input this number for the SMS verification code. Twilio will route the code straight to Crisp.</p>
                    <div className="mt-2 text-xl font-mono text-green-400">{site.twilio_number || <span className="text-red-400 text-sm">⚠️ Please Provision a Twilio Number First</span>}</div>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2"><Video size={16} className="text-purple-400"/> 3. The 2025 Video Verification Rule</h3>
                    <p className="text-sm text-slate-300 mb-2">Google requires a continuous, unedited video to prove existence for Service Area Businesses. Send these instructions to the supplier's WhatsApp:</p>
                    <ul className="text-xs text-slate-400 list-disc pl-5 space-y-1">
                        <li>Do not show your face or edit the video.</li>
                        <li>Start by filming a nearby street sign or landmark to prove local geography.</li>
                        <li>Walk to your branded vehicle or tour equipment and physically unlock/start it on camera.</li>
                        <li>Show a physical business license or printed marketing flyer.</li>
                    </ul>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 relative">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-white">4. Perfect JSON-LD NAP Schema</h3>
                        <button onClick={copySchema} className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded">
                            <Copy size={12} /> {copied ? 'Copied!' : 'Copy Code'}
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">This exact payload is being injected into the Astro website's `&lt;head&gt;`. Paste this exact Name, Address, and Phone into the GBP wizard so Google matches the web crawl perfectly.</p>
                    <pre className="text-xs text-emerald-400 bg-black/50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(schema, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
}
