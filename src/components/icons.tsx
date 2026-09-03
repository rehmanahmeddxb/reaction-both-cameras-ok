// src/components/icons.tsx
//
// Zero-dependency icon set for this app.
//
// `lucide-react` ships ~1,600 icons (43 MB in node_modules) but this app renders only 68.
// Those 68 icons are inlined below as plain SVG path data, extracted from lucide-react
// v0.546.0 (ISC license, https://lucide.dev/license) so the app behaves identically
// while `npm install` pulls one package less.
//
// Same API as before: className / style / size / strokeWidth props, ref-forwarded.
// Want the full library back?  npm i lucide-react  and change the import in each file.

import * as React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement> & { size?: number | string };
export type IconComponent = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>;

type IconNode = [string, Record<string, string | number>];

const toKebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function makeIcon(displayName: string, nodes: IconNode[]): IconComponent {
  const Component = React.forwardRef<SVGSVGElement, IconProps>(function Icon(
    { size = 24, strokeWidth = 2, ...props },
    ref,
  ) {
    return React.createElement(
      'svg',
      {
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        className: `lucide lucide-${toKebab(displayName)}`,
        ...props,
      },
      nodes.map(([tag, attrs], i) => React.createElement(tag, { ...attrs, key: i })),
    );
  });
  Component.displayName = displayName;
  return Component;
}

export const AlertCircle: IconComponent = /* @__PURE__ */ makeIcon('AlertCircle', [["circle",{"cx":"12","cy":"12","r":"10"}],["line",{"x1":"12","x2":"12","y1":"8","y2":"12"}],["line",{"x1":"12","x2":"12.01","y1":"16","y2":"16"}]]);
export const AlertTriangle: IconComponent = /* @__PURE__ */ makeIcon('AlertTriangle', [["path",{"d":"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"}],["path",{"d":"M12 9v4"}],["path",{"d":"M12 17h.01"}]]);
export const ArrowLeftRight: IconComponent = /* @__PURE__ */ makeIcon('ArrowLeftRight', [["path",{"d":"M8 3 4 7l4 4"}],["path",{"d":"M4 7h16"}],["path",{"d":"m16 21 4-4-4-4"}],["path",{"d":"M20 17H4"}]]);
export const Award: IconComponent = /* @__PURE__ */ makeIcon('Award', [["path",{"d":"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"}],["circle",{"cx":"12","cy":"8","r":"6"}]]);
export const Calendar: IconComponent = /* @__PURE__ */ makeIcon('Calendar', [["path",{"d":"M8 2v4"}],["path",{"d":"M16 2v4"}],["rect",{"width":"18","height":"18","x":"3","y":"4","rx":"2"}],["path",{"d":"M3 10h18"}]]);
export const Camera: IconComponent = /* @__PURE__ */ makeIcon('Camera', [["path",{"d":"M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"}],["circle",{"cx":"12","cy":"13","r":"3"}]]);
export const CameraOff: IconComponent = /* @__PURE__ */ makeIcon('CameraOff', [["path",{"d":"M14.564 14.558a3 3 0 1 1-4.122-4.121"}],["path",{"d":"m2 2 20 20"}],["path",{"d":"M20 20H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 .819-.175"}],["path",{"d":"M9.695 4.024A2 2 0 0 1 10.004 4h3.993a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v7.344"}]]);
export const Check: IconComponent = /* @__PURE__ */ makeIcon('Check', [["path",{"d":"M20 6 9 17l-5-5"}]]);
export const CheckCircle2: IconComponent = /* @__PURE__ */ makeIcon('CheckCircle2', [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"m9 12 2 2 4-4"}]]);
export const ChevronDown: IconComponent = /* @__PURE__ */ makeIcon('ChevronDown', [["path",{"d":"m6 9 6 6 6-6"}]]);
export const Circle: IconComponent = /* @__PURE__ */ makeIcon('Circle', [["circle",{"cx":"12","cy":"12","r":"10"}]]);
export const Clock: IconComponent = /* @__PURE__ */ makeIcon('Clock', [["path",{"d":"M12 6v6l4 2"}],["circle",{"cx":"12","cy":"12","r":"10"}]]);
export const Columns: IconComponent = /* @__PURE__ */ makeIcon('Columns', [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M12 3v18"}]]);
export const Copy: IconComponent = /* @__PURE__ */ makeIcon('Copy', [["rect",{"width":"14","height":"14","x":"8","y":"8","rx":"2","ry":"2"}],["path",{"d":"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"}]]);
export const CornerDownLeft: IconComponent = /* @__PURE__ */ makeIcon('CornerDownLeft', [["path",{"d":"M20 4v7a4 4 0 0 1-4 4H4"}],["path",{"d":"m9 10-5 5 5 5"}]]);
export const CornerDownRight: IconComponent = /* @__PURE__ */ makeIcon('CornerDownRight', [["path",{"d":"m15 10 5 5-5 5"}],["path",{"d":"M4 4v7a4 4 0 0 0 4 4h12"}]]);
export const CornerUpLeft: IconComponent = /* @__PURE__ */ makeIcon('CornerUpLeft', [["path",{"d":"M20 20v-7a4 4 0 0 0-4-4H4"}],["path",{"d":"M9 14 4 9l5-5"}]]);
export const CornerUpRight: IconComponent = /* @__PURE__ */ makeIcon('CornerUpRight', [["path",{"d":"m15 14 5-5-5-5"}],["path",{"d":"M4 20v-7a4 4 0 0 1 4-4h12"}]]);
export const Download: IconComponent = /* @__PURE__ */ makeIcon('Download', [["path",{"d":"M12 15V3"}],["path",{"d":"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}],["path",{"d":"m7 10 5 5 5-5"}]]);
export const Eye: IconComponent = /* @__PURE__ */ makeIcon('Eye', [["path",{"d":"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"}],["circle",{"cx":"12","cy":"12","r":"3"}]]);
export const EyeOff: IconComponent = /* @__PURE__ */ makeIcon('EyeOff', [["path",{"d":"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"}],["path",{"d":"M14.084 14.158a3 3 0 0 1-4.242-4.242"}],["path",{"d":"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"}],["path",{"d":"m2 2 20 20"}]]);
export const FileVideo: IconComponent = /* @__PURE__ */ makeIcon('FileVideo', [["path",{"d":"M14 2v4a2 2 0 0 0 2 2h4"}],["path",{"d":"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"}],["path",{"d":"M15.033 13.44a.647.647 0 0 1 0 1.12l-4.065 2.352a.645.645 0 0 1-.968-.56v-4.704a.645.645 0 0 1 .967-.56z"}]]);
export const Film: IconComponent = /* @__PURE__ */ makeIcon('Film', [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M7 3v18"}],["path",{"d":"M3 7.5h4"}],["path",{"d":"M3 12h18"}],["path",{"d":"M3 16.5h4"}],["path",{"d":"M17 3v18"}],["path",{"d":"M17 7.5h4"}],["path",{"d":"M17 16.5h4"}]]);
export const Flame: IconComponent = /* @__PURE__ */ makeIcon('Flame', [["path",{"d":"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"}]]);
export const Flashlight: IconComponent = /* @__PURE__ */ makeIcon('Flashlight', [["path",{"d":"M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12z"}],["line",{"x1":"6","x2":"18","y1":"6","y2":"6"}],["line",{"x1":"12","x2":"12","y1":"12","y2":"12"}]]);
export const FlipHorizontal: IconComponent = /* @__PURE__ */ makeIcon('FlipHorizontal', [["path",{"d":"M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3"}],["path",{"d":"M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"}],["path",{"d":"M12 20v2"}],["path",{"d":"M12 14v2"}],["path",{"d":"M12 8v2"}],["path",{"d":"M12 2v2"}]]);
export const HardDrive: IconComponent = /* @__PURE__ */ makeIcon('HardDrive', [["line",{"x1":"22","x2":"2","y1":"12","y2":"12"}],["path",{"d":"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"}],["line",{"x1":"6","x2":"6.01","y1":"16","y2":"16"}],["line",{"x1":"10","x2":"10.01","y1":"16","y2":"16"}]]);
export const Info: IconComponent = /* @__PURE__ */ makeIcon('Info', [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M12 16v-4"}],["path",{"d":"M12 8h.01"}]]);
export const Instagram: IconComponent = /* @__PURE__ */ makeIcon('Instagram', [["rect",{"width":"20","height":"20","x":"2","y":"2","rx":"5","ry":"5"}],["path",{"d":"M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"}],["line",{"x1":"17.5","x2":"17.51","y1":"6.5","y2":"6.5"}]]);
export const Languages: IconComponent = /* @__PURE__ */ makeIcon('Languages', [["path",{"d":"m5 8 6 6"}],["path",{"d":"m4 14 6-6 2-3"}],["path",{"d":"M2 5h12"}],["path",{"d":"M7 2h1"}],["path",{"d":"m22 22-5-10-5 10"}],["path",{"d":"M14 18h6"}]]);
export const Laugh: IconComponent = /* @__PURE__ */ makeIcon('Laugh', [["circle",{"cx":"12","cy":"12","r":"10"}],["path",{"d":"M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z"}],["line",{"x1":"9","x2":"9.01","y1":"9","y2":"9"}],["line",{"x1":"15","x2":"15.01","y1":"9","y2":"9"}]]);
export const Layers: IconComponent = /* @__PURE__ */ makeIcon('Layers', [["path",{"d":"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"}],["path",{"d":"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"}],["path",{"d":"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"}]]);
export const Layout: IconComponent = /* @__PURE__ */ makeIcon('Layout', [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M3 9h18"}],["path",{"d":"M9 21V9"}]]);
export const LayoutGrid: IconComponent = /* @__PURE__ */ makeIcon('LayoutGrid', [["rect",{"width":"7","height":"7","x":"3","y":"3","rx":"1"}],["rect",{"width":"7","height":"7","x":"14","y":"3","rx":"1"}],["rect",{"width":"7","height":"7","x":"14","y":"14","rx":"1"}],["rect",{"width":"7","height":"7","x":"3","y":"14","rx":"1"}]]);
export const Lightbulb: IconComponent = /* @__PURE__ */ makeIcon('Lightbulb', [["path",{"d":"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"}],["path",{"d":"M9 18h6"}],["path",{"d":"M10 22h4"}]]);
export const Link: IconComponent = /* @__PURE__ */ makeIcon('Link', [["path",{"d":"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"}],["path",{"d":"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"}]]);
export const Loader2: IconComponent = /* @__PURE__ */ makeIcon('Loader2', [["path",{"d":"M21 12a9 9 0 1 1-6.219-8.56"}]]);
export const Maximize: IconComponent = /* @__PURE__ */ makeIcon('Maximize', [["path",{"d":"M8 3H5a2 2 0 0 0-2 2v3"}],["path",{"d":"M21 8V5a2 2 0 0 0-2-2h-3"}],["path",{"d":"M3 16v3a2 2 0 0 0 2 2h3"}],["path",{"d":"M16 21h3a2 2 0 0 0 2-2v-3"}]]);
export const Maximize2: IconComponent = /* @__PURE__ */ makeIcon('Maximize2', [["path",{"d":"M15 3h6v6"}],["path",{"d":"m21 3-7 7"}],["path",{"d":"m3 21 7-7"}],["path",{"d":"M9 21H3v-6"}]]);
export const Mic: IconComponent = /* @__PURE__ */ makeIcon('Mic', [["path",{"d":"M12 19v3"}],["path",{"d":"M19 10v2a7 7 0 0 1-14 0v-2"}],["rect",{"x":"9","y":"2","width":"6","height":"13","rx":"3"}]]);
export const MicOff: IconComponent = /* @__PURE__ */ makeIcon('MicOff', [["path",{"d":"M12 19v3"}],["path",{"d":"M15 9.34V5a3 3 0 0 0-5.68-1.33"}],["path",{"d":"M16.95 16.95A7 7 0 0 1 5 12v-2"}],["path",{"d":"M18.89 13.23A7 7 0 0 0 19 12v-2"}],["path",{"d":"m2 2 20 20"}],["path",{"d":"M9 9v3a3 3 0 0 0 5.12 2.12"}]]);
export const Minimize2: IconComponent = /* @__PURE__ */ makeIcon('Minimize2', [["path",{"d":"m14 10 7-7"}],["path",{"d":"M20 10h-6V4"}],["path",{"d":"m3 21 7-7"}],["path",{"d":"M4 14h6v6"}]]);
export const Move: IconComponent = /* @__PURE__ */ makeIcon('Move', [["path",{"d":"M12 2v20"}],["path",{"d":"m15 19-3 3-3-3"}],["path",{"d":"m19 9 3 3-3 3"}],["path",{"d":"M2 12h20"}],["path",{"d":"m5 9-3 3 3 3"}],["path",{"d":"m9 5 3-3 3 3"}]]);
export const Palette: IconComponent = /* @__PURE__ */ makeIcon('Palette', [["path",{"d":"M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"}],["circle",{"cx":"13.5","cy":"6.5","r":".5","fill":"currentColor"}],["circle",{"cx":"17.5","cy":"10.5","r":".5","fill":"currentColor"}],["circle",{"cx":"6.5","cy":"12.5","r":".5","fill":"currentColor"}],["circle",{"cx":"8.5","cy":"7.5","r":".5","fill":"currentColor"}]]);
export const Pause: IconComponent = /* @__PURE__ */ makeIcon('Pause', [["rect",{"x":"14","y":"3","width":"5","height":"18","rx":"1"}],["rect",{"x":"5","y":"3","width":"5","height":"18","rx":"1"}]]);
export const Play: IconComponent = /* @__PURE__ */ makeIcon('Play', [["path",{"d":"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"}]]);
export const Radio: IconComponent = /* @__PURE__ */ makeIcon('Radio', [["path",{"d":"M16.247 7.761a6 6 0 0 1 0 8.478"}],["path",{"d":"M19.075 4.933a10 10 0 0 1 0 14.134"}],["path",{"d":"M4.925 19.067a10 10 0 0 1 0-14.134"}],["path",{"d":"M7.753 16.239a6 6 0 0 1 0-8.478"}],["circle",{"cx":"12","cy":"12","r":"2"}]]);
export const RefreshCw: IconComponent = /* @__PURE__ */ makeIcon('RefreshCw', [["path",{"d":"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}],["path",{"d":"M21 3v5h-5"}],["path",{"d":"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}],["path",{"d":"M8 16H3v5"}]]);
export const RotateCcw: IconComponent = /* @__PURE__ */ makeIcon('RotateCcw', [["path",{"d":"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}],["path",{"d":"M3 3v5h5"}]]);
export const Rows: IconComponent = /* @__PURE__ */ makeIcon('Rows', [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}],["path",{"d":"M3 12h18"}]]);
export const Scissors: IconComponent = /* @__PURE__ */ makeIcon('Scissors', [["circle",{"cx":"6","cy":"6","r":"3"}],["path",{"d":"M8.12 8.12 12 12"}],["path",{"d":"M20 4 8.12 15.88"}],["circle",{"cx":"6","cy":"18","r":"3"}],["path",{"d":"M14.8 14.8 20 20"}]]);
export const Share2: IconComponent = /* @__PURE__ */ makeIcon('Share2', [["circle",{"cx":"18","cy":"5","r":"3"}],["circle",{"cx":"6","cy":"12","r":"3"}],["circle",{"cx":"18","cy":"19","r":"3"}],["line",{"x1":"8.59","x2":"15.42","y1":"13.51","y2":"17.49"}],["line",{"x1":"15.41","x2":"8.59","y1":"6.51","y2":"10.49"}]]);
export const Sliders: IconComponent = /* @__PURE__ */ makeIcon('Sliders', [["path",{"d":"M10 8h4"}],["path",{"d":"M12 21v-9"}],["path",{"d":"M12 8V3"}],["path",{"d":"M17 16h4"}],["path",{"d":"M19 12V3"}],["path",{"d":"M19 21v-5"}],["path",{"d":"M3 14h4"}],["path",{"d":"M5 10V3"}],["path",{"d":"M5 21v-7"}]]);
export const Smartphone: IconComponent = /* @__PURE__ */ makeIcon('Smartphone', [["rect",{"width":"14","height":"20","x":"5","y":"2","rx":"2","ry":"2"}],["path",{"d":"M12 18h.01"}]]);
export const Sparkles: IconComponent = /* @__PURE__ */ makeIcon('Sparkles', [["path",{"d":"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"}],["path",{"d":"M20 2v4"}],["path",{"d":"M22 4h-4"}],["circle",{"cx":"4","cy":"20","r":"2"}]]);
export const Square: IconComponent = /* @__PURE__ */ makeIcon('Square', [["rect",{"width":"18","height":"18","x":"3","y":"3","rx":"2"}]]);
export const Subtitles: IconComponent = /* @__PURE__ */ makeIcon('Subtitles', [["rect",{"width":"18","height":"14","x":"3","y":"5","rx":"2","ry":"2"}],["path",{"d":"M7 15h4M15 15h2M7 11h2M13 11h4"}]]);
export const Sun: IconComponent = /* @__PURE__ */ makeIcon('Sun', [["circle",{"cx":"12","cy":"12","r":"4"}],["path",{"d":"M12 2v2"}],["path",{"d":"M12 20v2"}],["path",{"d":"m4.93 4.93 1.41 1.41"}],["path",{"d":"m17.66 17.66 1.41 1.41"}],["path",{"d":"M2 12h2"}],["path",{"d":"M20 12h2"}],["path",{"d":"m6.34 17.66-1.41 1.41"}],["path",{"d":"m19.07 4.93-1.41 1.41"}]]);
export const SwitchCamera: IconComponent = /* @__PURE__ */ makeIcon('SwitchCamera', [["path",{"d":"M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"}],["path",{"d":"M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5"}],["circle",{"cx":"12","cy":"12","r":"3"}],["path",{"d":"m18 22-3-3 3-3"}],["path",{"d":"m6 2 3 3-3 3"}]]);
export const Trash2: IconComponent = /* @__PURE__ */ makeIcon('Trash2', [["path",{"d":"M10 11v6"}],["path",{"d":"M14 11v6"}],["path",{"d":"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"}],["path",{"d":"M3 6h18"}],["path",{"d":"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"}]]);
export const Tv: IconComponent = /* @__PURE__ */ makeIcon('Tv', [["path",{"d":"m17 2-5 5-5-5"}],["rect",{"width":"20","height":"15","x":"2","y":"7","rx":"2"}]]);
export const Type: IconComponent = /* @__PURE__ */ makeIcon('Type', [["path",{"d":"M12 4v16"}],["path",{"d":"M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"}],["path",{"d":"M9 20h6"}]]);
export const Upload: IconComponent = /* @__PURE__ */ makeIcon('Upload', [["path",{"d":"M12 3v12"}],["path",{"d":"m17 8-5-5-5 5"}],["path",{"d":"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}]]);
export const Video: IconComponent = /* @__PURE__ */ makeIcon('Video', [["path",{"d":"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"}],["rect",{"x":"2","y":"6","width":"14","height":"12","rx":"2"}]]);
export const Volume2: IconComponent = /* @__PURE__ */ makeIcon('Volume2', [["path",{"d":"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"}],["path",{"d":"M16 9a5 5 0 0 1 0 6"}],["path",{"d":"M19.364 18.364a9 9 0 0 0 0-12.728"}]]);
export const Wand2: IconComponent = /* @__PURE__ */ makeIcon('Wand2', [["path",{"d":"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"}],["path",{"d":"m14 7 3 3"}],["path",{"d":"M5 6v4"}],["path",{"d":"M19 14v4"}],["path",{"d":"M10 2v2"}],["path",{"d":"M7 8H3"}],["path",{"d":"M21 16h-4"}],["path",{"d":"M11 3H9"}]]);
export const X: IconComponent = /* @__PURE__ */ makeIcon('X', [["path",{"d":"M18 6 6 18"}],["path",{"d":"m6 6 12 12"}]]);
export const Zap: IconComponent = /* @__PURE__ */ makeIcon('Zap', [["path",{"d":"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"}]]);
