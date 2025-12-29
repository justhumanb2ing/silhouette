import { LocalizedLink } from "./localized-link";

export default function Logo() {
  return (
    <div className="overflow-hidden font-satoshi font-black text-xl">
      <LocalizedLink to={"/"}>Poketto</LocalizedLink>
    </div>
  );
}
