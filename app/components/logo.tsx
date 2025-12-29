import { LocalizedLink } from "./localized-link";

export default function Logo() {
  return (
    <div className="overflow-hidden font-black text-2xl italic tracking-tighter px-2">
      <LocalizedLink to={"/"}>Poketto</LocalizedLink>
    </div>
  );
}
