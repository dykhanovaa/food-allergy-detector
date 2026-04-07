from fastapi import APIRouter
from fastapi.responses import Response

router = APIRouter()

@router.get("/sitemap.xml")
def sitemap():
    xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>http://localhost:5173/</loc>
    <priority>1.0</priority>
    <changefreq>weekly</changefreq>
  </url>
  <url>
    <loc>http://localhost:5173/login</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>http://localhost:5173/register</loc>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>
  <url>
    <loc>http://localhost:5173/barcode-lookup</loc>
    <priority>0.9</priority>
    <changefreq>monthly</changefreq>
  </url>
</urlset>"""
    return Response(content=xml, media_type="application/xml")

@router.get("/robots.txt")
def robots():
    txt = """User-agent: *
Allow: /

Disallow: /profile/
Disallow: /scans/
Disallow: /admin/

Sitemap: http://localhost:8000/sitemap.xml
"""
    return Response(content=txt, media_type="text/plain")