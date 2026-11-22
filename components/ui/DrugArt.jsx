// Illustrated stand-ins for products that have no photo yet. Not stock photos:
// each one is a simple pharmacy object chosen from the product's name / dosage form.
const TINTS = [
  ['#E4F2EA', '#CFE8DB'], ['#FFF3D1', '#FFE6A0'], ['#FDE7E3', '#F9D0C9'],
  ['#E3EEFA', '#CFE0F4'], ['#EFE7FA', '#DDD0F2'], ['#E2F4F1', '#C9E8E2'],
];

const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
export const tintFor = (product) => TINTS[hash(product?.category_name || product?.name || 'x') % TINTS.length];

export function drugKind(p) {
  const name = `${p?.name || ''} ${p?.generic_name || ''}`.toLowerCase();
  if (/syrup|linctus|suspension|solution|liquid/.test(name)) return 'syrup';
  if (/cream|gel|ointment|toothpaste|paste|balm|lotion/.test(name)) return 'tube';
  if (/drops|eye|ear |nasal|spray/.test(name)) return 'dropper';
  if (/syringe|injection|insulin|needle/.test(name)) return 'syringe';
  if (/test|strip|kit|wipes|plaster|floss|pick|device|monitor|gloves|mask/.test(name)) return 'box';
  if (/tablet|tabs|capsule|\bmg\b|\d+mg/.test(name)) return 'blister';
  const f = String(p?.dosage_form || '').toLowerCase();
  if (f === 'syrup') return 'syrup';
  if (f === 'cream') return 'tube';
  if (f === 'drops') return 'dropper';
  if (f === 'injection') return 'syringe';
  if (f === 'tablet' || f === 'capsule') return 'blister';
  return 'bottle';
}

const Cross = ({ x, y, s = 1, c = '#1B7F5A' }) => (
  <path d={`M${x} ${y - 16 * s}v${32 * s}M${x - 16 * s} ${y}h${32 * s}`} stroke={c} strokeWidth={7 * s} strokeLinecap="round" />
);
const Shadow = ({ w = 46 }) => <ellipse cx="100" cy="178" rx={w} ry="7" fill="rgba(7,43,31,.14)" />;

const ART = {
  bottle: (
    <g>
      <Shadow />
      <rect x="64" y="52" width="72" height="122" rx="15" fill="#E9962B" />
      <rect x="71" y="64" width="11" height="96" rx="5.5" fill="#F7BF6A" opacity=".6" />
      <rect x="58" y="28" width="84" height="32" rx="9" fill="#fff" />
      <rect x="58" y="28" width="84" height="9" rx="4.5" fill="#E3EAE6" />
      <rect x="72" y="84" width="56" height="62" rx="7" fill="#fff" />
      <Cross x={100} y={115} />
    </g>
  ),
  syrup: (
    <g>
      <Shadow w={44} />
      <rect x="85" y="20" width="30" height="26" rx="7" fill="#0A3D2C" />
      <path d="M88 46h24v13c0 7 24 12 24 32v73a12 12 0 0 1-12 12H76a12 12 0 0 1-12-12V91c0-20 24-25 24-32z" fill="#2E9A6E" />
      <path d="M74 98c0-8 6-12 12-14v82a6 6 0 0 1-12 0z" fill="#8FD3B3" opacity=".5" />
      <rect x="72" y="104" width="56" height="52" rx="7" fill="#fff" />
      <rect x="80" y="113" width="40" height="5" rx="2.5" fill="#B3C2B9" />
      <rect x="80" y="123" width="28" height="5" rx="2.5" fill="#D5DFD9" />
      <Cross x={100} y={142} s={0.45} />
    </g>
  ),
  blister: (
    <g>
      <Shadow w={56} />
      <rect x="36" y="50" width="128" height="104" rx="14" fill="#E3EAE6" />
      <rect x="36" y="50" width="128" height="104" rx="14" fill="none" stroke="#C5D1CA" strokeWidth="3" />
      {[66, 100, 134].flatMap((cx) => [82, 120].map((cy) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="15" fill="#fff" stroke="#B9C7BF" strokeWidth="2.5" />
          <rect x={cx - 9} y={cy - 5} width="18" height="10" rx="5" fill="#FFC21F" transform={`rotate(-35 ${cx} ${cy})`} />
        </g>
      )))}
    </g>
  ),
  tube: (
    <g>
      <Shadow w={38} />
      <rect x="84" y="24" width="32" height="28" rx="7" fill="#0A3D2C" />
      <path d="M77 52h46l9 104H68z" fill="#1B7F5A" />
      <path d="M77 52h12l-3 104H68z" fill="#fff" opacity=".18" />
      <rect x="64" y="154" width="72" height="12" rx="3" fill="#0F6648" />
      <path d="M74 88h52l2 38H72z" fill="#fff" />
      <Cross x={100} y={107} s={0.55} />
    </g>
  ),
  dropper: (
    <g>
      <Shadow w={40} />
      <path d="M96 16h8l-1.5 28h-5z" fill="#D5DFD9" />
      <rect x="84" y="42" width="32" height="32" rx="7" fill="#0A3D2C" />
      <rect x="90" y="74" width="20" height="10" fill="#E3EAE6" />
      <rect x="68" y="84" width="64" height="88" rx="18" fill="#74BA95" />
      <path d="M78 100c0-6 4-10 9-11v70a4.5 4.5 0 0 1-9 0z" fill="#fff" opacity=".35" />
      <rect x="76" y="112" width="48" height="42" rx="7" fill="#fff" />
      <Cross x={100} y={133} s={0.5} />
    </g>
  ),
  syringe: (
    <g transform="translate(100 104) scale(.8) rotate(-32) translate(-100 -100)">
      <rect x="54" y="86" width="84" height="30" rx="7" fill="#fff" stroke="#B9C7BF" strokeWidth="3" />
      <rect x="64" y="93" width="50" height="16" rx="4" fill="#74BA95" />
      <rect x="30" y="95" width="26" height="12" rx="3" fill="#B9C7BF" />
      <rect x="20" y="84" width="9" height="34" rx="3" fill="#8A9C92" />
      <rect x="136" y="91" width="12" height="20" rx="3" fill="#E3EAE6" />
      <rect x="146" y="98" width="38" height="6" rx="3" fill="#B9C7BF" />
    </g>
  ),
  box: (
    <g>
      <Shadow w={54} />
      <rect x="46" y="58" width="108" height="98" rx="11" fill="#fff" />
      <rect x="46" y="58" width="108" height="30" rx="11" fill="#1B7F5A" />
      <rect x="46" y="76" width="108" height="12" fill="#1B7F5A" />
      <Cross x={100} y={123} s={0.9} />
      <rect x="62" y="68" width="40" height="6" rx="3" fill="#fff" opacity=".7" />
    </g>
  ),
};

export default function DrugArt({ product, kind }) {
  const k = kind || drugKind(product);
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label={product?.name ? `${product.name} illustration` : 'Medicine illustration'}
      preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {ART[k] || ART.bottle}
    </svg>
  );
}
