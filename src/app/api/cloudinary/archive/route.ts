import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

let dynamicEnv: any = {};
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    dynamicEnv = dotenv.parse(fs.readFileSync(envPath));
  }
} catch (e) {
  console.log("Could not dynamically load .env.local", e);
}

cloudinary.config({
  cloud_name: dynamicEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: dynamicEnv.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: dynamicEnv.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    const { resources } = await cloudinary.search
      .expression('folder:Cheerio/Archives/Images AND resource_type:image')
      .sort_by('created_at', 'desc')
      .max_results(500)
      .execute();

    const urls = resources.map((r: any) => ({
      url: r.secure_url,
      type: r.resource_type,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ success: true, data: urls });
  } catch (error: any) {
    console.error('Cloudinary fetch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
