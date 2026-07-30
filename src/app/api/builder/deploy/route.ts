import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAuth } from "@/lib/session";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const site = await db.execute({
      sql: "SELECT * FROM built_sites WHERE id = ?",
      args: [id],
    });

    if (!site.rows.length) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const row = site.rows[0] as Record<string, unknown>;
    if (!row.preview_html) {
      return NextResponse.json({ error: "No generated HTML found. Generate first." }, { status: 400 });
    }

    const siteSlug = String(row.business_name || 'site')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);

    const deployDir = path.join(process.cwd(), '..', 'built-sites', siteSlug);
    fs.mkdirSync(deployDir, { recursive: true });

    fs.writeFileSync(path.join(deployDir, 'index.html'), row.preview_html as string);
    fs.writeFileSync(path.join(deployDir, 'vercel.json'), JSON.stringify({ version: 2, builds: [{ src: "*.html", use: "@vercel/static" }], routes: [{ src: "/(.*)", dest: "/index.html" }] }));

    let url = null;
    try {
      execSync(`npx vercel --cwd "${deployDir}" --yes --name "${siteSlug}" --token "${process.env.VERCEL_TOKEN || ''}"`, { timeout: 60000, stdio: 'pipe' });
      const output = execSync(`npx vercel --cwd "${deployDir}" --yes --prod --token "${process.env.VERCEL_TOKEN || ''}"`, { timeout: 60000, stdio: 'pipe' }).toString();
      const urlMatch = output.match(/https:\/\/[^\s'"]+/);
      url = urlMatch ? urlMatch[0].replace(/[^a-zA-Z0-9:\/.-]/g, '') : `https://${siteSlug}.vercel.app`;
    } catch (e: unknown) {
      const err = e as { stdout?: Buffer; message?: string };
      const msg = err.stdout?.toString() || err.message || 'Deploy failed';
      const urlMatch = msg.match(/https:\/\/[^\s'"]+/);
      url = urlMatch ? urlMatch[0].replace(/[^a-zA-Z0-9:\/.-]/g, '') : null;
      if (!url) {
        await db.execute({
          sql: "UPDATE built_sites SET status = 'deploy_failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          args: [id],
        });
        return NextResponse.json({ error: `Deploy failed: ${msg.substring(0, 200)}` }, { status: 500 });
      }
    }

    await db.execute({
      sql: "UPDATE built_sites SET status = 'deployed', site_url = ?, vercel_url = ?, deployed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [url, url, id],
    });

    return NextResponse.json({ success: true, url, id });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Deploy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
