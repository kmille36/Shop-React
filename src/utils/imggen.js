// Generates a distinct SVG "detail shot" as a data-URI so the gallery
// has visually different images without needing extra photo files.
export function detailImage(name, hue = 250, label = 'CHI TIẾT') {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='hsl(${hue},70%,72%)'/>
      <stop offset='1' stop-color='hsl(${(hue + 40) % 360},70%,58%)'/>
    </linearGradient></defs>
    <rect width='600' height='600' fill='url(#g)'/>
    <rect x='20' y='20' width='560' height='560' rx='28' fill='none' stroke='rgba(255,255,255,.5)' stroke-width='3'/>
    <text x='300' y='250' font-family='Segoe UI,sans-serif' font-size='40' font-weight='800' fill='#fff' text-anchor='middle'>${label}</text>
    <text x='300' y='320' font-family='Segoe UI,sans-serif' font-size='26' fill='rgba(255,255,255,.92)' text-anchor='middle'>${name}</text>
    <text x='300' y='470' font-family='Segoe UI,sans-serif' font-size='20' fill='rgba(255,255,255,.7)' text-anchor='middle'>ShopReact</text>
  </svg>`
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}
