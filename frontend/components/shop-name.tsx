function splitShopName(name: string): [string, string] {
  const trimmed = name.trim();
  if (trimmed.includes(' ')) {
    const i = trimmed.lastIndexOf(' ') + 1;
    return [trimmed.slice(0, i), trimmed.slice(i)];
  }
  const m = trimmed.match(/^(.+?)([A-Z][a-zà-ÿ]+)$/);
  return m ? [m[1], m[2]] : [trimmed, ''];
}

// Dernier mot en rouge : "AD Sport Solutions" -> "AD Sport " blanc + "Solutions" rouge
export default function ShopName({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) {
  const [first, second] = splitShopName(name);
  return (
    <span className={className}>
      {first}
      {second && <span className="text-action">{second}</span>}
    </span>
  );
}